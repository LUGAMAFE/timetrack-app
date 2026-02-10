import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getMonthlyStats(userId: string, month: string) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;

    // Fetch all time entries for the month
    const { data: entries, error: entriesError } = await this.supabaseService
      .getAdminClient()
      .from('time_entries')
      .select(`
        id,
        category_id,
        duration_minutes,
        date,
        categories(id, name, color, icon, monthly_goal_hours, monthly_limit_hours)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (entriesError) {
      this.logger.error(`Error fetching monthly stats: ${entriesError.message}`);
      throw new BadRequestException(entriesError.message);
    }

    // Fetch all categories for the user
    const { data: allCategories } = await this.supabaseService
      .getAdminClient()
      .from('categories')
      .select('id, name, color, icon, monthly_goal_hours, monthly_limit_hours')
      .eq('user_id', userId);

    // Calculate totals
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const categoriesUsed = new Set(entries.map((e) => e.category_id)).size;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    entries.forEach((entry) => {
      categoryTotals[entry.category_id] = (categoryTotals[entry.category_id] || 0) + (entry.duration_minutes || 0);
    });

    const categoryBreakdown = (allCategories || []).map((cat) => {
      const totalMins = categoryTotals[cat.id] || 0;
      const goalHours = cat.monthly_goal_hours || 0;
      const progressPercent = goalHours > 0 ? Math.round((totalMins / 60 / goalHours) * 100) : 0;

      return {
        category_id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        total_minutes: totalMins,
        goal_hours: cat.monthly_goal_hours,
        limit_hours: cat.monthly_limit_hours,
        progress_percent: progressPercent,
      };
    });

    // Daily totals
    const dailyMap: Record<string, number> = {};
    entries.forEach((entry) => {
      dailyMap[entry.date] = (dailyMap[entry.date] || 0) + (entry.duration_minutes || 0);
    });

    const dailyTotals = Object.entries(dailyMap)
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_hours: Math.round((totalMinutes / 60) * 100) / 100,
      categories_used: categoriesUsed,
      category_breakdown: categoryBreakdown,
      daily_totals: dailyTotals,
    };
  }
}
