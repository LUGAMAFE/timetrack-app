-- =============================================
-- TIME INVESTMENT TRACKER V2 - COMMAND CENTER
-- =============================================

-- Drop existing tables if needed (be careful in production)
-- DROP TABLE IF EXISTS time_entries, categories, user_streaks;

-- =============================================
-- CATEGORIES (Enhanced)
-- =============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_type VARCHAR(20) DEFAULT 'standard';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS default_block_duration INTEGER DEFAULT 60; -- minutes
ALTER TABLE categories ADD COLUMN IF NOT EXISTS requires_rest_after BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS rest_duration_minutes INTEGER DEFAULT 15;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS max_continuous_minutes INTEGER; -- null means no limit
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_rest_category BOOLEAN DEFAULT false;

-- =============================================
-- MONTHLY GOALS & LIMITS
-- =============================================
CREATE TABLE IF NOT EXISTS monthly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target_hours DECIMAL(6,2) NOT NULL,
  goal_type VARCHAR(20) NOT NULL DEFAULT 'minimum', -- 'minimum' or 'maximum'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, year, month)
);

-- =============================================
-- WEEKLY TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEMPLATE BLOCKS (blocks within a template)
-- =============================================
CREATE TABLE IF NOT EXISTS template_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES weekly_templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title VARCHAR(200),
  notes TEXT,
  is_flexible BOOLEAN DEFAULT false, -- can be moved if needed
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- =============================================
-- SCHEDULED BLOCKS (actual daily schedule)
-- =============================================
CREATE TABLE IF NOT EXISTS scheduled_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  template_block_id UUID REFERENCES template_blocks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title VARCHAR(200),
  notes TEXT,
  is_flexible BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- =============================================
-- BLOCK VALIDATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS block_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_block_id UUID NOT NULL REFERENCES scheduled_blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'partial', 'omitted', 'pending')),
  actual_start_time TIME,
  actual_end_time TIME,
  actual_duration_minutes INTEGER,
  completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  omission_reason_id UUID REFERENCES omission_reasons(id),
  omission_notes TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scheduled_block_id)
);

-- =============================================
-- OMISSION REASONS
-- =============================================
CREATE TABLE IF NOT EXISTS omission_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null for system defaults
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'health', 'emergency', 'laziness', 'external', 'rescheduled', etc.
  is_system_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default omission reasons
INSERT INTO omission_reasons (name, category, is_system_default) VALUES
  ('Felt tired/exhausted', 'health', true),
  ('Got sick', 'health', true),
  ('Family emergency', 'emergency', true),
  ('Work emergency', 'emergency', true),
  ('Overslept', 'laziness', true),
  ('Procrastinated', 'laziness', true),
  ('Lost track of time', 'laziness', true),
  ('Previous block ran over', 'external', true),
  ('Unexpected visitor/call', 'external', true),
  ('Rescheduled to later', 'rescheduled', true),
  ('Changed priorities', 'rescheduled', true),
  ('Other', 'other', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- REST RULES
-- =============================================
CREATE TABLE IF NOT EXISTS rest_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- null means all categories
  trigger_duration_minutes INTEGER NOT NULL, -- after X minutes
  rest_duration_minutes INTEGER NOT NULL DEFAULT 15,
  rest_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_mandatory BOOLEAN DEFAULT false, -- if true, system enforces it
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTINUOUS USAGE LIMITS
-- =============================================
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  max_continuous_minutes INTEGER NOT NULL,
  max_daily_hours DECIMAL(4,2),
  max_weekly_hours DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- =============================================
-- ROUTINE VIOLATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS routine_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_block_id UUID REFERENCES scheduled_blocks(id) ON DELETE SET NULL,
  violation_type VARCHAR(50) NOT NULL, -- 'rest_skipped', 'continuous_exceeded', 'limit_exceeded', 'goal_at_risk'
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'critical'
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI INSIGHTS
-- =============================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'feasibility', 'prediction', 'pattern', 'suggestion', 'recovery'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  data JSONB, -- additional structured data
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WEEKLY GOALS (for weekly layer)
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  target_hours DECIMAL(5,2) NOT NULL,
  goal_type VARCHAR(20) NOT NULL DEFAULT 'minimum',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, year, week_number)
);

-- =============================================
-- APPLIED TEMPLATES (track when templates are applied to weeks)
-- =============================================
CREATE TABLE IF NOT EXISTS applied_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES weekly_templates(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_scheduled_blocks_user_date ON scheduled_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scheduled_blocks_date ON scheduled_blocks(date);
CREATE INDEX IF NOT EXISTS idx_block_validations_user ON block_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_period ON monthly_goals(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_period ON weekly_goals(user_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_routine_violations_user ON routine_violations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can manage their monthly_goals" ON monthly_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their weekly_templates" ON weekly_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their template_blocks" ON template_blocks FOR ALL USING (
  template_id IN (SELECT id FROM weekly_templates WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage their scheduled_blocks" ON scheduled_blocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their block_validations" ON block_validations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their rest_rules" ON rest_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their usage_limits" ON usage_limits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their routine_violations" ON routine_violations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their ai_insights" ON ai_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their weekly_goals" ON weekly_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their applied_templates" ON applied_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view omission_reasons" ON omission_reasons FOR SELECT USING (
  is_system_default = true OR user_id = auth.uid()
);
