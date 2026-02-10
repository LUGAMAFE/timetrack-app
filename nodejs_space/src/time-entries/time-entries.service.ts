import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto, TimeEntryQueryDto } from './dto/time-entry.dto';

@Injectable()
export class TimeEntriesService {
  private readonly logger = new Logger(TimeEntriesService.name);

  constructor(private supabaseService: SupabaseService) {}

  private calculateDurationMinutes(startTime: string, endTime: string): number {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.round((end - start) / 60000);
  }

  async findAll(userId: string, query: TimeEntryQueryDto) {
    let queryBuilder = this.supabaseService
      .getAdminClient()
      .from('time_entries')
      .select(`
        id,
        category_id,
        start_time,
        end_time,
        duration_minutes,
        notes,
        date,
        categories(name, color, icon)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (query.month) {
      const [year, month] = query.month.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      queryBuilder = queryBuilder.gte('date', startDate).lte('date', endDate);
    }

    if (query.category_id) {
      queryBuilder = queryBuilder.eq('category_id', query.category_id);
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      this.logger.error(`Error fetching time entries: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return data.map((entry: any) => ({
      id: entry.id,
      category_id: entry.category_id,
      category_name: entry.categories?.name,
      category_color: entry.categories?.color,
      category_icon: entry.categories?.icon,
      start_time: entry.start_time,
      end_time: entry.end_time,
      duration_minutes: entry.duration_minutes,
      notes: entry.notes,
      date: entry.date,
    }));
  }

  async create(userId: string, dto: CreateTimeEntryDto) {
    const duration_minutes = this.calculateDurationMinutes(dto.start_time, dto.end_time);

    if (duration_minutes <= 0) {
      throw new BadRequestException('End time must be after start time');
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('time_entries')
      .insert({
        user_id: userId,
        category_id: dto.category_id,
        start_time: dto.start_time,
        end_time: dto.end_time,
        duration_minutes,
        notes: dto.notes,
        date: dto.date,
      })
      .select(`
        id,
        category_id,
        start_time,
        end_time,
        duration_minutes,
        notes,
        date,
        categories(name, color)
      `)
      .single();

    if (error) {
      this.logger.error(`Error creating time entry: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      ...data,
      category_name: (data as any).categories?.name,
      category_color: (data as any).categories?.color,
    };
  }

  async update(userId: string, id: string, dto: UpdateTimeEntryDto) {
    const updateData: any = { ...dto };

    if (dto.start_time && dto.end_time) {
      updateData.duration_minutes = this.calculateDurationMinutes(dto.start_time, dto.end_time);
    } else if (dto.start_time || dto.end_time) {
      // Fetch existing entry to calculate new duration
      const { data: existing } = await this.supabaseService
        .getAdminClient()
        .from('time_entries')
        .select('start_time, end_time')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        const startTime = dto.start_time || existing.start_time;
        const endTime = dto.end_time || existing.end_time;
        updateData.duration_minutes = this.calculateDurationMinutes(startTime, endTime);
      }
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('time_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        id,
        category_id,
        start_time,
        end_time,
        duration_minutes,
        notes,
        date,
        categories(name, color)
      `)
      .single();

    if (error) {
      this.logger.error(`Error updating time entry: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Time entry not found');

    return {
      ...data,
      category_name: (data as any).categories?.name,
      category_color: (data as any).categories?.color,
    };
  }

  async delete(userId: string, id: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('time_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting time entry: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }
}
