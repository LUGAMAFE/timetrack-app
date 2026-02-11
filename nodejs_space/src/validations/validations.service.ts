import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ValidateBlockDto {
  status: 'completed' | 'partial' | 'omitted';
  actual_start_time?: string;
  actual_end_time?: string;
  completion_percentage?: number;
  omission_reason_id?: string;
  omission_notes?: string;
}

@Injectable()
export class ValidationsService {
  private readonly logger = new Logger(ValidationsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async validateBlock(userId: string, blockId: string, dto: ValidateBlockDto) {
    // Verify block exists and belongs to user
    const { data: block } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select('*, category:categories(*)')
      .eq('id', blockId)
      .eq('user_id', userId)
      .single();

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    // Calculate actual duration if times provided
    let actualDuration: number | undefined;
    if (dto.actual_start_time && dto.actual_end_time) {
      const start = this.timeToMinutes(dto.actual_start_time);
      const end = this.timeToMinutes(dto.actual_end_time);
      actualDuration = end - start;
    }

    // Update or insert validation
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .upsert({
        scheduled_block_id: blockId,
        user_id: userId,
        status: dto.status,
        actual_start_time: dto.actual_start_time,
        actual_end_time: dto.actual_end_time,
        actual_duration_minutes: actualDuration,
        completion_percentage: dto.completion_percentage ?? (dto.status === 'completed' ? 100 : dto.status === 'omitted' ? 0 : 50),
        omission_reason_id: dto.omission_reason_id,
        omission_notes: dto.omission_notes,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'scheduled_block_id',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error validating block: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Check for violations (rest rules, continuous usage, etc.)
    await this.checkViolations(userId, block, dto);

    return data;
  }

  async getPendingValidations(userId: string, date?: string) {
    // If no date provided, only get TODAY's pending blocks
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .select(`
        id,
        block_id,
        status,
        scheduled_block:scheduled_blocks!inner(
          id,
          date,
          start_time,
          end_time,
          title,
          notes,
          is_flexible,
          priority,
          category:categories(*)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .eq('scheduled_block.date', targetDate)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching pending validations: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Transform to PendingBlock format with days_ago calculation
    const today = new Date().toISOString().split('T')[0];
    const transformed = (data ?? []).map((validation: any) => {
      const block = validation?.scheduled_block;
      if (!block || !block?.date) return null;

      const blockDate = new Date(block.date);
      const todayDate = new Date(today);
      const daysAgo = Math.floor((todayDate.getTime() - blockDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...block,
        days_ago: daysAgo,
        validation_id: validation.id, // Include validation ID for updates
      };
    }).filter(Boolean);

    return transformed;
  }

  async getValidationStats(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .select(`
        status,
        completion_percentage,
        scheduled_block:scheduled_blocks!inner(
          date,
          category_id,
          category:categories(name, color)
        )
      `)
      .eq('user_id', userId)
      .gte('scheduled_block.date', startDate)
      .lte('scheduled_block.date', endDate);

    if (error) {
      this.logger.error(`Error fetching validation stats: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Aggregate stats
    const stats = {
      total: data?.length ?? 0,
      completed: 0,
      partial: 0,
      omitted: 0,
      pending: 0,
      averageCompletion: 0,
      byCategory: {} as Record<string, { completed: number; partial: number; omitted: number; pending: number }>,
    };

    let totalCompletion = 0;
    for (const v of data ?? []) {
      stats[v.status as keyof typeof stats]++;
      totalCompletion += v.completion_percentage ?? 0;

      const catId = (v.scheduled_block as any)?.category_id;
      if (catId) {
        if (!stats.byCategory[catId]) {
          stats.byCategory[catId] = { completed: 0, partial: 0, omitted: 0, pending: 0 };
        }
        stats.byCategory[catId][v.status as 'completed' | 'partial' | 'omitted' | 'pending']++;
      }
    }

    stats.averageCompletion = stats.total > 0 ? Math.round(totalCompletion / stats.total) : 0;

    return stats;
  }

  async getOmissionReasons() {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('omission_reasons')
      .select('*')
      .eq('is_system_default', true)
      .order('category', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  private async checkViolations(userId: string, block: any, validation: ValidateBlockDto) {
    // Check if rest was skipped after long work block
    if (validation.status === 'completed' && block.category?.requires_rest_after) {
      const blockDuration = this.timeToMinutes(block.end_time) - this.timeToMinutes(block.start_time);
      if (blockDuration >= 90) {
        // Check if next block is rest
        const { data: nextBlocks } = await this.supabaseService
          .getAdminClient()
          .from('scheduled_blocks')
          .select('*, category:categories(*)')
          .eq('user_id', userId)
          .eq('date', block.date)
          .gt('start_time', block.end_time)
          .order('start_time', { ascending: true })
          .limit(1);

        const nextBlock = nextBlocks?.[0];
        if (!nextBlock || !nextBlock.category?.is_rest_category) {
          await this.createViolation(userId, block.id, 'rest_skipped', block.category_id,
            `No rest block scheduled after ${blockDuration} minute ${block.category?.name} session`,
            'warning');
        }
      }
    }
  }

  private async createViolation(
    userId: string,
    blockId: string | null,
    type: string,
    categoryId: string | null,
    description: string,
    severity: string
  ) {
    await this.supabaseService
      .getAdminClient()
      .from('routine_violations')
      .insert({
        user_id: userId,
        scheduled_block_id: blockId,
        violation_type: type,
        category_id: categoryId,
        description,
        severity,
      });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
