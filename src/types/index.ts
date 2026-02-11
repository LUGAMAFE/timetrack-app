export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthly_goal_hours?: number;
  monthly_limit_hours?: number;
  is_default: boolean;
  created_at?: string;
}

export interface TimeEntry {
  id: string;
  category_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string;
  date: string;
  category?: Category;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  streak_increased?: boolean;
}

export interface CategoryBreakdown {
  category_id: string;
  name: string;
  color: string;
  icon: string;
  total_minutes: number;
  goal_hours?: number;
  limit_hours?: number;
  progress_percent: number;
}

export interface MonthlyStats {
  total_hours: number;
  categories_used: number;
  category_breakdown: CategoryBreakdown[];
  daily_totals: { date: string; minutes: number }[];
}

export interface CreateTimeEntryDto {
  category_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  date: string;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  color: string;
  monthly_goal_hours?: number;
  monthly_limit_hours?: number;
}
