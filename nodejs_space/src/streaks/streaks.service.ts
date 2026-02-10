import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getStreak(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('user_streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error(`Error fetching streak: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return data || { current_streak: 0, longest_streak: 0, last_activity_date: null };
  }

  async updateStreak(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get current streak data
    const currentData = await this.getStreak(userId);
    let { current_streak, longest_streak, last_activity_date } = currentData;
    let streakIncreased = false;

    if (last_activity_date === today) {
      // Already logged today, no change
      return { current_streak, longest_streak, streak_increased: false };
    }

    if (last_activity_date === yesterday) {
      // Consecutive day - increase streak
      current_streak += 1;
      streakIncreased = true;
    } else if (!last_activity_date || last_activity_date < yesterday) {
      // Streak broken or new user - reset to 1
      current_streak = 1;
      streakIncreased = true;
    }

    // Update longest if current exceeds it
    if (current_streak > longest_streak) {
      longest_streak = current_streak;
    }

    // Upsert streak data
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('user_streaks')
      .upsert(
        {
          user_id: userId,
          current_streak,
          longest_streak,
          last_activity_date: today,
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      this.logger.error(`Error updating streak: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return { current_streak, longest_streak, streak_increased: streakIncreased };
  }
}
