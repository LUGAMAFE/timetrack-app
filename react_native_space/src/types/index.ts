// ============================================
// CORE TYPES
// ============================================

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  monthly_goal_hours?: number;
  monthly_limit_hours?: number;
  is_default?: boolean;
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

// ============================================
// SCHEDULED BLOCKS
// ============================================

export interface ScheduledBlock {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  date: string;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  is_flexible: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  crosses_midnight?: boolean; // true if block spans past midnight (e.g., 23:00 to 05:00)
  notes?: string;
  recurrence_rule?: string;
  source_template_id?: string;
  category?: Category;
  validation?: BlockValidation;
  created_at?: string;
  updated_at?: string;
}

export interface CreateScheduledBlockDto {
  category_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  is_flexible?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  crosses_midnight?: boolean; // Auto-calculated by backend if not provided
}

export interface UpdateScheduledBlockDto extends Partial<CreateScheduledBlockDto> {}

// ============================================
// VALIDATIONS
// ============================================

export type ValidationStatus = 'completed' | 'partial' | 'omitted';

export interface BlockValidation {
  id: string;
  block_id: string;
  user_id: string;
  status: ValidationStatus;
  actual_start_time?: string;
  actual_end_time?: string;
  completion_percent?: number;
  omission_reason_id?: string;
  notes?: string;
  validated_at: string;
  omission_reason?: OmissionReason;
}

export interface OmissionReason {
  id: string;
  code: string;
  label: string;
  description?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidateBlockDto {
  status: ValidationStatus;
  actual_start_time?: string;
  actual_end_time?: string;
  completion_percent?: number;
  omission_reason_id?: string;
  notes?: string;
}

export interface PendingBlock extends ScheduledBlock {
  days_ago: number;
}

// ============================================
// GOALS
// ============================================

export interface MonthlyGoal {
  id: string;
  user_id: string;
  category_id: string;
  year: number;
  month: number;
  target_hours: number;
  goal_type: 'minimum' | 'maximum';
  notes?: string;
  category?: Category;
  created_at?: string;
}

export interface WeeklyGoal {
  id: string;
  user_id: string;
  category_id: string;
  year: number;
  week_number: number;
  target_hours: number;
  goal_type: 'minimum' | 'maximum';
  notes?: string;
  category?: Category;
  created_at?: string;
}

export interface CreateMonthlyGoalDto {
  category_id: string;
  year: number;
  month: number;
  target_hours: number;
  goal_type: 'minimum' | 'maximum';
  notes?: string;
}

export interface CreateWeeklyGoalDto {
  category_id: string;
  year: number;
  week_number: number;
  target_hours: number;
  goal_type: 'minimum' | 'maximum';
  notes?: string;
}

export interface GoalProgress {
  goal_id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  target_hours: number;
  scheduled_hours: number;
  completed_hours: number;
  progress_percent: number;
  goal_type: 'minimum' | 'maximum';
  on_track: boolean;
}

export interface DailyBudget {
  category_id: string;
  category_name: string;
  category_color: string;
  daily_hours_needed: number;
  remaining_days: number;
  monthly_target: number;
  current_scheduled: number;
}

// ============================================
// TEMPLATES
// ============================================

export interface WeeklyTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at?: string;
  blocks?: TemplateBlock[];
}

export interface TemplateBlock {
  id: string;
  template_id: string;
  category_id: string;
  title: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  is_flexible: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: Category;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface CreateTemplateBlockDto {
  category_id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_flexible?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApplyTemplateDto {
  template_id: string;
  start_date: string;
  clear_existing?: boolean;
}

// ============================================
// RULES
// ============================================

export interface RestRule {
  id: string;
  user_id: string;
  category_id: string;
  rest_category_id?: string;
  after_minutes: number;
  rest_duration_minutes: number;
  is_mandatory: boolean;
  category?: Category;
  rest_category?: Category;
  created_at?: string;
}

export interface UsageLimit {
  id: string;
  user_id: string;
  category_id: string;
  limit_type: 'continuous' | 'daily' | 'weekly';
  max_minutes: number;
  category?: Category;
  created_at?: string;
}

export interface RoutineViolation {
  id: string;
  user_id: string;
  violation_type: 'rest_rule' | 'usage_limit';
  rule_id?: string;
  limit_id?: string;
  violated_at: string;
  description: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}

export interface CreateRestRuleDto {
  category_id: string;
  rest_category_id?: string;
  after_minutes: number;
  rest_duration_minutes: number;
  is_mandatory?: boolean;
}

export interface CreateUsageLimitDto {
  category_id: string;
  limit_type: 'continuous' | 'daily' | 'weekly';
  max_minutes: number;
}

// ============================================
// AI INSIGHTS
// ============================================

export type InsightType = 'feasibility' | 'prediction' | 'pattern' | 'suggestion' | 'time_leak' | 'recovery';

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  confidence_score?: number;
  data?: Record<string, any>;
  is_dismissed: boolean;
  dismissed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface FeasibilityAnalysis {
  is_feasible: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
  overloaded_days: string[];
  underutilized_days: string[];
}

export interface PredictionAlert {
  category_id: string;
  category_name: string;
  risk_level: 'low' | 'medium' | 'high';
  prediction: string;
  based_on: string;
}

export interface TimeLeak {
  category_id: string;
  category_name: string;
  expected_hours: number;
  actual_hours: number;
  leak_hours: number;
  common_reasons: string[];
}

export interface RecoverySuggestion {
  day: string;
  blocks: {
    category_id: string;
    title: string;
    start_time: string;
    end_time: string;
  }[];
}

// ============================================
// DASHBOARD & STATS
// ============================================

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

export interface DashboardStats {
  period: 'week' | 'month' | 'custom';
  total_blocks: number;
  completed_blocks: number;
  partial_blocks: number;
  omitted_blocks: number;
  completion_rate: number;
  total_scheduled_hours: number;
  total_completed_hours: number;
  category_breakdown: CategoryBreakdown[];
  top_omission_reasons: { reason: string; count: number }[];
  streak: StreakData;
  goal_progress: GoalProgress[];
}

export interface DaySummary {
  date: string;
  total_blocks: number;
  completed: number;
  partial: number;
  omitted: number;
  pending: number;
  dominant_category?: Category;
  completion_percent: number;
}

// ============================================
// NAVIGATION TYPES
// ============================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Plan: undefined;
  Validate: undefined;
  Insights: undefined;
  Settings: undefined;
};

export type PlanStackParamList = {
  WeeklyPlan: undefined;
  MonthlyOverview: undefined;
  TemplateEditor: { templateId?: string };
  TemplateList: undefined;
};

export type InsightsStackParamList = {
  Dashboard: undefined;
  AICoach: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Categories: undefined;
  CategoryEditor: { categoryId?: string };
  Goals: undefined;
  Rules: undefined;
  Profile: undefined;
};

// ============================================
// UTILITY TYPES
// ============================================

export interface CreateCategoryDto {
  name: string;
  icon: string;
  color: string;
  monthly_goal_hours?: number;
  monthly_limit_hours?: number;
}

export interface CreateTimeEntryDto {
  category_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  date: string;
}
