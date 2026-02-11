import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CreateMonthlyGoalDto {
  category_id: string;
  year: number;
  month: number;
  target_hours: number;
  goal_type: 'minimum' | 'maximum';
}

export interface CreateWeeklyGoalDto {
  category_id: string;
  year: number;
  week_number: number;
  target_hours: number;
  goal_type: 'minimum' | 'maximum';
}

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // ==================== MONTHLY GOALS ====================

  async getMonthlyGoals(userId: string, year: number, month: number) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('monthly_goals')
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month);

    if (error) {
      this.logger.error(`Error fetching monthly goals: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async createMonthlyGoal(userId: string, dto: CreateMonthlyGoalDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('monthly_goals')
      .upsert({
        user_id: userId,
        ...dto,
      }, {
        onConflict: 'user_id,category_id,year,month',
      })
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .single();

    if (error) {
      this.logger.error(`Error creating monthly goal: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async deleteMonthlyGoal(userId: string, goalId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('monthly_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== WEEKLY GOALS ====================

  async getWeeklyGoals(userId: string, year: number, weekNumber: number) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_goals')
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('year', year)
      .eq('week_number', weekNumber);

    if (error) {
      this.logger.error(`Error fetching weekly goals: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async createWeeklyGoal(userId: string, dto: CreateWeeklyGoalDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_goals')
      .upsert({
        user_id: userId,
        ...dto,
      }, {
        onConflict: 'user_id,category_id,year,week_number',
      })
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .single();

    if (error) {
      this.logger.error(`Error creating weekly goal: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async deleteWeeklyGoal(userId: string, goalId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== PROGRESS TRACKING ====================

  async getMonthlyProgress(userId: string, year: number, month: number) {
    // Get goals
    const goals = await this.getMonthlyGoals(userId, year, month);

    // Get completed hours per category from validated blocks
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: validations } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .select(`
        status,
        actual_duration_minutes,
        completion_percentage,
        scheduled_block:scheduled_blocks!inner(
          category_id,
          date,
          start_time,
          end_time
        )
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'partial'])
      .gte('scheduled_block.date', startDate)
      .lte('scheduled_block.date', endDate);

    // Calculate hours per category
    const hoursByCategory: Record<string, number> = {};
    for (const v of validations ?? []) {
      const catId = (v.scheduled_block as any)?.category_id;
      if (!catId) continue;

      let minutes = v.actual_duration_minutes;
      if (!minutes && v.scheduled_block) {
        const sb = v.scheduled_block as any;
        const startMinutes = this.timeToMinutes(sb.start_time);
        const endMinutes = this.timeToMinutes(sb.end_time);
        minutes = (endMinutes - startMinutes) * ((v.completion_percentage ?? 100) / 100);
      }

      hoursByCategory[catId] = (hoursByCategory[catId] ?? 0) + (minutes ?? 0) / 60;
    }

    // Combine goals with progress
    const progress = goals.map((goal: any) => {
      const achieved = hoursByCategory[goal.category_id] ?? 0;
      const target = goal.target_hours;
      const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
      const remaining = Math.max(0, target - achieved);
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const currentDay = today.getFullYear() === year && today.getMonth() + 1 === month
        ? today.getDate()
        : daysInMonth;
      const daysRemaining = daysInMonth - currentDay;
      const dailyRequired = daysRemaining > 0 ? remaining / daysRemaining : remaining;

      return {
        ...goal,
        achieved: Math.round(achieved * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentage,
        status: this.getGoalStatus(goal.goal_type, achieved, target, percentage),
        dailyRequired: Math.round(dailyRequired * 100) / 100,
        daysRemaining,
      };
    });

    // Add categories without goals but with time
    const goalsCategories = new Set(goals.map((g: any) => g.category_id));
    for (const [catId, hours] of Object.entries(hoursByCategory)) {
      if (!goalsCategories.has(catId)) {
        progress.push({
          category_id: catId,
          achieved: Math.round(hours * 100) / 100,
          target_hours: null,
          goal_type: null,
          percentage: null,
          status: 'no_goal',
        });
      }
    }

    return progress;
  }

  async getWeeklyProgress(userId: string, year: number, weekNumber: number) {
    const goals = await this.getWeeklyGoals(userId, year, weekNumber);

    // Calculate week start/end dates
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear);
    weekStart.setDate(firstDayOfYear.getDate() + daysOffset - firstDayOfYear.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

    const { data: validations } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .select(`
        status,
        actual_duration_minutes,
        completion_percentage,
        scheduled_block:scheduled_blocks!inner(
          category_id,
          date,
          start_time,
          end_time
        )
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'partial'])
      .gte('scheduled_block.date', startDate)
      .lte('scheduled_block.date', endDate);

    const hoursByCategory: Record<string, number> = {};
    for (const v of validations ?? []) {
      const catId = (v.scheduled_block as any)?.category_id;
      if (!catId) continue;

      let minutes = v.actual_duration_minutes;
      if (!minutes && v.scheduled_block) {
        const sb = v.scheduled_block as any;
        const startMinutes = this.timeToMinutes(sb.start_time);
        const endMinutes = this.timeToMinutes(sb.end_time);
        minutes = (endMinutes - startMinutes) * ((v.completion_percentage ?? 100) / 100);
      }

      hoursByCategory[catId] = (hoursByCategory[catId] ?? 0) + (minutes ?? 0) / 60;
    }

    return goals.map((goal: any) => {
      const achieved = hoursByCategory[goal.category_id] ?? 0;
      const target = goal.target_hours;
      const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;

      return {
        ...goal,
        achieved: Math.round(achieved * 100) / 100,
        remaining: Math.max(0, Math.round((target - achieved) * 100) / 100),
        percentage,
        status: this.getGoalStatus(goal.goal_type, achieved, target, percentage),
      };
    });
  }

  private getGoalStatus(goalType: string, achieved: number, target: number, percentage: number): string {
    if (goalType === 'minimum') {
      if (percentage >= 100) return 'achieved';
      if (percentage >= 80) return 'on_track';
      if (percentage >= 50) return 'at_risk';
      return 'behind';
    } else {
      // maximum/limit
      if (percentage >= 100) return 'exceeded';
      if (percentage >= 80) return 'approaching';
      return 'within_limit';
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
