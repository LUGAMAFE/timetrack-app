import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CreateBlockDto {
  category_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title?: string;
  notes?: string;
  is_flexible?: boolean;
  priority?: string; // 'low' | 'medium' | 'high' | 'critical'
  crosses_midnight?: boolean; // Auto-calculated if not provided
}

export interface UpdateBlockDto extends Partial<CreateBlockDto> {}

@Injectable()
export class ScheduledBlocksService {
  private readonly logger = new Logger(ScheduledBlocksService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private convertPriorityToNumber(priority?: string): number {
    if (!priority) return 5; // default medium
    const priorityMap: Record<string, number> = {
      low: 3,
      medium: 5,
      high: 7,
      critical: 10,
    };
    return priorityMap[priority.toLowerCase()] ?? 5;
  }

  private detectCrossesMidnight(startTime: string, endTime: string): boolean {
    // If end_time < start_time, it crosses midnight (e.g., 23:00 to 05:00)
    return endTime < startTime;
  }

  private prepareBlockData(dto: CreateBlockDto | UpdateBlockDto) {
    const { priority, start_time, end_time, crosses_midnight, ...rest } = dto;
    
    // Auto-detect if crosses midnight if not explicitly provided
    const crossesMidnight = crosses_midnight !== undefined 
      ? crosses_midnight 
      : (start_time && end_time ? this.detectCrossesMidnight(start_time, end_time) : false);
    
    const prepared: any = {
      ...rest,
      ...(start_time && { start_time }),
      ...(end_time && { end_time }),
      priority: typeof priority === 'string' ? this.convertPriorityToNumber(priority) : priority,
    };
    
    // Only add crosses_midnight if explicitly provided or detected
    // This makes the code work even if the column doesn't exist in the DB yet
    if (crossesMidnight) {
      prepared.crosses_midnight = crossesMidnight;
    }
    
    return prepared;
  }

  async findByDate(userId: string, date: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select(`
        *,
        category:categories(*),
        validation:block_validations(*)
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching blocks: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async findByDateRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select(`
        *,
        category:categories(*),
        validation:block_validations(*)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching blocks: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async create(userId: string, dto: CreateBlockDto) {
    // Validate no overlapping blocks on SAME date
    const existing = await this.findByDate(userId, dto.date);
    const overlappingBlock = existing.find((block: any) => {
      return this.timesOverlap(
        dto.start_time,
        dto.end_time,
        block.start_time,
        block.end_time
      );
    });

    if (overlappingBlock) {
      this.logger.warn(
        `Overlap detected: New block ${dto.start_time}-${dto.end_time} overlaps with existing ${overlappingBlock.start_time}-${overlappingBlock.end_time} (${overlappingBlock.title})`
      );
      throw new BadRequestException(
        `Block overlaps with existing block "${overlappingBlock.title}" (${overlappingBlock.start_time}-${overlappingBlock.end_time})`
      );
    }
    
    // ALSO check blocks from PREVIOUS day that might cross midnight into this day
    const prevDate = new Date(dto.date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevDayBlocks = await this.findByDate(userId, prevDateStr);
    
    const prevDayOverlap = prevDayBlocks.find((block: any) => {
      // Only check blocks that cross midnight
      const crossesMidnight = this.detectCrossesMidnight(block.start_time, block.end_time);
      if (!crossesMidnight) return false;
      
      // Block from previous day crosses midnight - check if new block overlaps with the "morning portion"
      // If prev block is 23:00-05:00, it occupies 00:00-05:00 on dto.date
      const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      
      const newStart = timeToMinutes(dto.start_time);
      const newEnd = timeToMinutes(dto.end_time);
      const prevEnd = timeToMinutes(block.end_time);
      
      // New block overlaps if it starts before the prev block ends (on next day)
      // Example: prev block 23:00-05:00 occupies 00:00-05:00 on next day
      // New block 00:00-00:21 overlaps because 00:00 < 05:00
      // New block 05:00-06:00 does NOT overlap because 05:00 >= 05:00
      return newStart < prevEnd;
    });
    
    if (prevDayOverlap) {
      this.logger.warn(
        `Overlap with previous day's midnight-crossing block: New ${dto.start_time}-${dto.end_time} overlaps with ${prevDayOverlap.title} from ${prevDateStr} (${prevDayOverlap.start_time}-${prevDayOverlap.end_time})`
      );
      throw new BadRequestException(
        `Block overlaps with "${prevDayOverlap.title}" from previous day (${prevDayOverlap.start_time}-${prevDayOverlap.end_time})`
      );
    }

    // Convert priority string to number for database
    const preparedData = this.prepareBlockData(dto);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .insert({
        user_id: userId,
        ...preparedData,
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      this.logger.error(`Error creating block: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Create pending validation
    await this.supabaseService
      .getAdminClient()
      .from('block_validations')
      .insert({
        scheduled_block_id: data.id,
        user_id: userId,
        status: 'pending',
      });

    return data;
  }

  async update(userId: string, blockId: string, dto: UpdateBlockDto) {
    // Verify ownership
    const { data: existing } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .select('*')
      .eq('id', blockId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      throw new NotFoundException('Block not found');
    }

    // Check for overlaps if time is being changed
    if (dto.start_time || dto.end_time) {
      const blocks = await this.findByDate(userId, dto.date || existing.date);
      const hasOverlap = blocks.some((block: any) => {
        if (block.id === blockId) return false;
        return this.timesOverlap(
          dto.start_time || existing.start_time,
          dto.end_time || existing.end_time,
          block.start_time,
          block.end_time
        );
      });

      if (hasOverlap) {
        throw new BadRequestException('Block overlaps with existing block');
      }
    }

    // Convert priority string to number for database
    const preparedData = this.prepareBlockData(dto);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .update({ ...preparedData, updated_at: new Date().toISOString() })
      .eq('id', blockId)
      .eq('user_id', userId)
      .select(`
        *,
        category:categories(*),
        validation:block_validations(*)
      `)
      .single();

    if (error) {
      this.logger.error(`Error updating block: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async delete(userId: string, blockId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_blocks')
      .delete()
      .eq('id', blockId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting block: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  async applyTemplate(userId: string, templateId: string, weekStartDate: string) {
    // Get template blocks
    const { data: templateBlocks, error: templateError } = await this.supabaseService
      .getAdminClient()
      .from('template_blocks')
      .select('*')
      .eq('template_id', templateId);

    if (templateError) {
      throw new BadRequestException(templateError.message);
    }

    if (!templateBlocks || templateBlocks.length === 0) {
      throw new BadRequestException('Template has no blocks');
    }

    // Calculate dates for the week
    const startDate = new Date(weekStartDate);
    const blocksToCreate: CreateBlockDto[] = [];

    for (const tb of templateBlocks) {
      const blockDate = new Date(startDate);
      blockDate.setDate(startDate.getDate() + tb.day_of_week);
      
      blocksToCreate.push({
        category_id: tb.category_id,
        date: blockDate.toISOString().split('T')[0],
        start_time: tb.start_time,
        end_time: tb.end_time,
        title: tb.title,
        notes: tb.notes,
        is_flexible: tb.is_flexible,
        priority: tb.priority,
      });
    }

    // Create all blocks (skip overlaps)
    const created = [];
    for (const block of blocksToCreate) {
      try {
        const result = await this.create(userId, block);
        created.push(result);
      } catch (e) {
        this.logger.warn(`Skipped block due to overlap: ${block.date} ${block.start_time}`);
      }
    }

    // Record template application
    const weekNumber = this.getWeekNumber(startDate);
    await this.supabaseService
      .getAdminClient()
      .from('applied_templates')
      .upsert({
        user_id: userId,
        template_id: templateId,
        year: startDate.getFullYear(),
        week_number: weekNumber,
      });

    return { created: created.length, skipped: blocksToCreate.length - created.length };
  }

  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const crosses1 = this.detectCrossesMidnight(start1, end1);
    const crosses2 = this.detectCrossesMidnight(start2, end2);

    // Both blocks cross midnight
    if (crosses1 && crosses2) {
      // Both extend past midnight, they always overlap
      return true;
    }

    // Only block 1 crosses midnight (e.g., 23:00-05:00)
    if (crosses1) {
      // Block 1 spans: [start1->24:00] and [00:00->end1]
      // Check if block 2 overlaps either part
      return start2 >= start1 || end2 <= end1;
    }

    // Only block 2 crosses midnight
    if (crosses2) {
      // Block 2 spans: [start2->24:00] and [00:00->end2]
      return start1 >= start2 || end1 <= end2;
    }

    // Neither crosses midnight - normal comparison
    return start1 < end2 && end1 > start2;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
