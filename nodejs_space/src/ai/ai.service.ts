import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { GoalsService } from '../goals/goals.service';
import { ValidationsService } from '../validations/validations.service';
import { RulesService } from '../rules/rules.service';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://apps.abacus.ai/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly goalsService: GoalsService,
    private readonly validationsService: ValidationsService,
    private readonly rulesService: RulesService,
  ) {}

  // ==================== FEASIBILITY ANALYSIS ====================

  async analyzeFeasibility(userId: string, weekStartDate: string) {
    // Get scheduled blocks for the week
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const endDate = weekEnd.toISOString().split('T')[0];

    const { data: blocks } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select('*, category:categories(name, color)')
      .eq('user_id', userId)
      .gte('date', weekStartDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time');

    // Get historical validation stats
    const historicalStats = await this.validationsService.getValidationStats(
      userId,
      this.getDateWeeksAgo(4),
      this.getDateWeeksAgo(0)
    );

    // Get rules
    const restRules = await this.rulesService.getRestRules(userId);
    const usageLimits = await this.rulesService.getUsageLimits(userId);

    // Get monthly goals
    const today = new Date();
    const monthlyProgress = await this.goalsService.getMonthlyProgress(
      userId,
      today.getFullYear(),
      today.getMonth() + 1
    );

    // Analyze with AI
    const analysis = await this.callLLM([
      {
        role: 'system',
        content: `You are a time management AI coach. Analyze the user's weekly routine and provide actionable feedback. Be direct and specific. Respond in JSON format with the following structure:
{
  "feasibility_score": number (0-100),
  "risk_level": "low" | "medium" | "high",
  "issues": [{ "type": string, "description": string, "severity": "low" | "medium" | "high", "suggestion": string }],
  "strengths": [string],
  "recommendations": [{ "title": string, "description": string, "priority": "high" | "medium" | "low" }],
  "summary": string
}`
      },
      {
        role: 'user',
        content: `Analyze this weekly routine for feasibility:

Scheduled Blocks:
${JSON.stringify(blocks, null, 2)}

Historical Completion Stats (last 4 weeks):
- Completed: ${historicalStats.completed}
- Partial: ${historicalStats.partial}
- Omitted: ${historicalStats.omitted}
- Average completion: ${historicalStats.averageCompletion}%

Rest Rules: ${JSON.stringify(restRules)}
Usage Limits: ${JSON.stringify(usageLimits)}

Monthly Goal Progress:
${JSON.stringify(monthlyProgress, null, 2)}

Look for:
1. Missing rest blocks after long work sessions
2. Unrealistic time allocations
3. Patterns that historically lead to omissions
4. Goal alignment issues`
      }
    ], true);

    // Save insight
    await this.saveInsight(userId, 'feasibility', 'Weekly Routine Analysis', analysis.summary, analysis, analysis.feasibility_score / 100);

    return analysis;
  }

  // ==================== PREDICTIVE ALERTS ====================

  async generatePredictiveAlerts(userId: string) {
    // Get omission patterns
    const { data: validations } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .select(`
        *,
        omission_reason:omission_reasons(name, category),
        scheduled_block:scheduled_blocks!inner(
          date,
          start_time,
          end_time,
          category:categories(name)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'omitted')
      .order('created_at', { ascending: false })
      .limit(100);

    // Get upcoming blocks for next 3 days
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const { data: upcomingBlocks } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select('*, category:categories(name)')
      .eq('user_id', userId)
      .gte('date', today)
      .lte('date', threeDaysLater.toISOString().split('T')[0]);

    const analysis = await this.callLLM([
      {
        role: 'system',
        content: `You are a predictive time management AI. Analyze omission patterns and upcoming schedule to predict potential issues. Respond in JSON format:
{
  "alerts": [{
    "block_affected": { "date": string, "time": string, "category": string },
    "risk_score": number (0-100),
    "reason": string,
    "suggestion": string
  }],
  "patterns_identified": [{
    "pattern": string,
    "frequency": string,
    "impact": string
  }]
}`
      },
      {
        role: 'user',
        content: `Analyze omission patterns and predict risks for upcoming blocks:

Historical Omissions (last 100):
${JSON.stringify(validations?.map(v => ({
  day_of_week: new Date((v.scheduled_block as any)?.date).toLocaleDateString('en-US', { weekday: 'long' }),
  time: (v.scheduled_block as any)?.start_time,
  category: (v.scheduled_block as any)?.category?.name,
  reason: (v.omission_reason as any)?.name
})), null, 2)}

Upcoming Blocks:
${JSON.stringify(upcomingBlocks?.map(b => ({
  date: b.date,
  day_of_week: new Date(b.date).toLocaleDateString('en-US', { weekday: 'long' }),
  time: b.start_time,
  category: (b.category as any)?.name
})), null, 2)}

Identify:
1. Day/time patterns (e.g., Friday afternoons)
2. Category patterns (e.g., always skipping exercise)
3. Reason patterns (e.g., mostly due to tiredness)`
      }
    ], true);

    // Save high-risk alerts as insights
    for (const alert of analysis.alerts ?? []) {
      if (alert.risk_score >= 70) {
        await this.saveInsight(
          userId,
          'prediction',
          `Risk Alert: ${alert.block_affected.category}`,
          alert.reason,
          alert,
          alert.risk_score / 100
        );
      }
    }

    return analysis;
  }

  // ==================== PATTERN RECOGNITION ====================

  async analyzeTimeLeaks(userId: string) {
    // Get validations with actual vs planned times
    const { data: validations } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .select(`
        actual_start_time,
        actual_end_time,
        actual_duration_minutes,
        scheduled_block:scheduled_blocks!inner(
          date,
          start_time,
          end_time,
          category:categories(name)
        )
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'partial'])
      .not('actual_duration_minutes', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    // Calculate time differences
    const timeLeaks = validations?.map(v => {
      const sb = v.scheduled_block as any;
      const plannedStart = this.timeToMinutes(sb.start_time);
      const plannedEnd = this.timeToMinutes(sb.end_time);
      const plannedDuration = plannedEnd - plannedStart;
      const actualDuration = v.actual_duration_minutes ?? plannedDuration;
      const difference = actualDuration - plannedDuration;

      return {
        category: sb.category?.name,
        date: sb.date,
        planned_duration: plannedDuration,
        actual_duration: actualDuration,
        difference,
        started_late: v.actual_start_time ? this.timeToMinutes(v.actual_start_time) - plannedStart : 0,
      };
    }) ?? [];

    const analysis = await this.callLLM([
      {
        role: 'system',
        content: `You are a time efficiency analyst. Identify "time leaks" where users consistently spend more time than planned. Respond in JSON format:
{
  "time_leaks": [{
    "category": string,
    "average_overrun_minutes": number,
    "frequency": string,
    "pattern": string,
    "suggestion": string
  }],
  "late_start_patterns": [{
    "category": string,
    "average_delay_minutes": number,
    "suggestion": string
  }],
  "total_time_lost_weekly_estimate": number,
  "top_recommendation": string
}`
      },
      {
        role: 'user',
        content: `Analyze these time differences between planned and actual durations:

${JSON.stringify(timeLeaks, null, 2)}

Identify categories where users consistently:
1. Run over their planned time
2. Start late
3. Have the biggest gaps between planned and actual`
      }
    ], true);

    // Save insight
    await this.saveInsight(
      userId,
      'pattern',
      'Time Leak Analysis',
      analysis.top_recommendation,
      analysis,
      null
    );

    return analysis;
  }

  // ==================== SMART REDISTRIBUTION ====================

  async suggestRecoveryRoutine(userId: string) {
    const today = new Date();
    const monthlyProgress = await this.goalsService.getMonthlyProgress(
      userId,
      today.getFullYear(),
      today.getMonth() + 1
    );

    // Filter goals that are behind
    const behindGoals = monthlyProgress.filter((g: any) =>
      g.goal_type === 'minimum' && g.status === 'behind'
    );

    if (behindGoals.length === 0) {
      return {
        message: 'All goals are on track! No recovery routine needed.',
        suggestions: []
      };
    }

    // Get available time slots for rest of month
    const daysRemaining = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();

    const analysis = await this.callLLM([
      {
        role: 'system',
        content: `You are a recovery planning AI. Create an aggressive but realistic recovery routine to help users meet their monthly goals. Respond in JSON format:
{
  "recovery_plan": {
    "feasibility": "possible" | "challenging" | "unlikely",
    "required_daily_hours": { [category: string]: number },
    "schedule_suggestions": [{
      "day_type": "weekday" | "weekend",
      "blocks": [{ "category": string, "duration_hours": number, "suggested_time": string }]
    }],
    "tradeoffs": [string],
    "tips": [string]
  },
  "motivation": string
}`
      },
      {
        role: 'user',
        content: `Create a recovery routine for these behind goals:

${JSON.stringify(behindGoals.map((g: any) => ({
  category: g.category?.name,
  target_hours: g.target_hours,
  achieved_hours: g.achieved,
  remaining_hours: g.remaining,
  days_remaining: g.daysRemaining,
  required_daily: g.dailyRequired
})), null, 2)}

Days remaining in month: ${daysRemaining}

Create a realistic but aggressive plan to catch up.`
      }
    ], true);

    // Save insight
    await this.saveInsight(
      userId,
      'recovery',
      'Recovery Routine Suggestion',
      analysis.motivation,
      analysis,
      null
    );

    return analysis;
  }

  // ==================== GET INSIGHTS ====================

  async getInsights(userId: string, type?: string, includeRead = false) {
    let query = this.supabaseService
      .getAdminClient()
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (type) {
      query = query.eq('insight_type', type);
    }

    if (!includeRead) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async markInsightRead(userId: string, insightId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', insightId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  async dismissInsight(userId: string, insightId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('ai_insights')
      .update({ is_dismissed: true })
      .eq('id', insightId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== HELPERS ====================

  private async callLLM(messages: LLMMessage[], jsonResponse = false): Promise<any> {
    const apiKey = this.configService.get<string>('ABACUSAI_API_KEY');

    if (!apiKey) {
      this.logger.error('ABACUSAI_API_KEY not configured');
      throw new BadRequestException('AI service not configured');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages,
          stream: false,
          ...(jsonResponse ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`LLM API error: ${errorText}`);
        throw new BadRequestException('AI analysis failed');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (jsonResponse) {
        try {
          return JSON.parse(content);
        } catch {
          this.logger.warn('Failed to parse JSON response from LLM');
          return { raw: content };
        }
      }

      return content;
    } catch (error: any) {
      this.logger.error(`LLM call failed: ${error.message}`);
      throw new BadRequestException('AI analysis failed');
    }
  }

  private async saveInsight(
    userId: string,
    type: string,
    title: string,
    description: string,
    data: any,
    confidenceScore: number | null
  ) {
    await this.supabaseService
      .getAdminClient()
      .from('ai_insights')
      .insert({
        user_id: userId,
        insight_type: type,
        title,
        description,
        data,
        confidence_score: confidenceScore,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getDateWeeksAgo(weeks: number): string {
    const date = new Date();
    date.setDate(date.getDate() - weeks * 7);
    return date.toISOString().split('T')[0];
  }
}
