import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CreateRestRuleDto {
  category_id?: string;
  trigger_duration_minutes: number;
  rest_duration_minutes: number;
  rest_category_id?: string;
  is_mandatory?: boolean;
}

export interface CreateUsageLimitDto {
  category_id: string;
  max_continuous_minutes: number;
  max_daily_hours?: number;
  max_weekly_hours?: number;
}

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // ==================== REST RULES ====================

  async getRestRules(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('rest_rules')
      .select(`
        *,
        category:categories(id, name, icon, color),
        rest_category:categories(id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async createRestRule(userId: string, dto: CreateRestRuleDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('rest_rules')
      .insert({
        user_id: userId,
        ...dto,
      })
      .select(`
        *,
        category:categories(id, name, icon, color),
        rest_category:categories(id, name, icon, color)
      `)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async updateRestRule(userId: string, ruleId: string, dto: Partial<CreateRestRuleDto & { is_active: boolean }>) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('rest_rules')
      .update(dto)
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async deleteRestRule(userId: string, ruleId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('rest_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== USAGE LIMITS ====================

  async getUsageLimits(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('usage_limits')
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async createUsageLimit(userId: string, dto: CreateUsageLimitDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('usage_limits')
      .upsert({
        user_id: userId,
        ...dto,
      }, {
        onConflict: 'user_id,category_id',
      })
      .select(`
        *,
        category:categories(id, name, icon, color)
      `)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async updateUsageLimit(userId: string, limitId: string, dto: Partial<CreateUsageLimitDto & { is_active: boolean }>) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('usage_limits')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', limitId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async deleteUsageLimit(userId: string, limitId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('usage_limits')
      .delete()
      .eq('id', limitId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== VIOLATIONS ====================

  async getViolations(userId: string, acknowledged?: boolean) {
    let query = this.supabaseService
      .getAdminClient()
      .from('routine_violations')
      .select(`
        *,
        category:categories(id, name, icon, color),
        scheduled_block:scheduled_blocks(id, date, start_time, end_time, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (acknowledged !== undefined) {
      query = query.eq('acknowledged', acknowledged);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async acknowledgeViolation(userId: string, violationId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('routine_violations')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', violationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async acknowledgeAllViolations(userId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('routine_violations')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('acknowledged', false);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== RULE CHECKING ====================

  async checkBlockViolations(userId: string, date: string, categoryId: string, startTime: string, endTime: string) {
    const violations: Array<{ type: string; message: string; severity: string }> = [];
    const blockDuration = this.timeToMinutes(endTime) - this.timeToMinutes(startTime);

    // Check usage limits
    const limits = await this.getUsageLimits(userId);
    const categoryLimit = limits.find((l: any) => l.category_id === categoryId);

    if (categoryLimit) {
      // Check continuous limit
      if (categoryLimit.max_continuous_minutes && blockDuration > categoryLimit.max_continuous_minutes) {
        violations.push({
          type: 'continuous_exceeded',
          message: `Block exceeds maximum continuous time of ${categoryLimit.max_continuous_minutes} minutes`,
          severity: 'warning',
        });
      }

      // Check daily limit
      if (categoryLimit.max_daily_hours) {
        const dailyTotal = await this.getDailyHours(userId, date, categoryId);
        if ((dailyTotal + blockDuration / 60) > categoryLimit.max_daily_hours) {
          violations.push({
            type: 'daily_exceeded',
            message: `Adding this block would exceed daily limit of ${categoryLimit.max_daily_hours} hours`,
            severity: 'warning',
          });
        }
      }
    }

    // Check rest rules
    const restRules = await this.getRestRules(userId);
    const applicableRule = restRules.find((r: any) =>
      (!r.category_id || r.category_id === categoryId) &&
      blockDuration >= r.trigger_duration_minutes
    );

    if (applicableRule) {
      violations.push({
        type: 'rest_suggested',
        message: `A ${applicableRule.rest_duration_minutes} minute rest break is recommended after this ${blockDuration} minute block`,
        severity: applicableRule.is_mandatory ? 'critical' : 'info',
      });
    }

    return violations;
  }

  private async getDailyHours(userId: string, date: string, categoryId: string): Promise<number> {
    const { data } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select('start_time, end_time')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('category_id', categoryId);

    let total = 0;
    for (const block of data ?? []) {
      const start = this.timeToMinutes(block.start_time);
      const end = this.timeToMinutes(block.end_time);
      total += (end - start) / 60;
    }
    return total;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
