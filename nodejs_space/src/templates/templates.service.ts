import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CreateTemplateDto {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface CreateTemplateBlockDto {
  template_id: string;
  category_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title?: string;
  notes?: string;
  is_flexible?: boolean;
  priority?: number;
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_templates')
      .select(`
        *,
        blocks:template_blocks(
          *,
          category:categories(id, name, icon, color)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching templates: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async findOne(userId: string, templateId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_templates')
      .select(`
        *,
        blocks:template_blocks(
          *,
          category:categories(id, name, icon, color)
        )
      `)
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Template not found');
    }
    return data;
  }

  async create(userId: string, dto: CreateTemplateDto) {
    // If setting as default, unset other defaults
    if (dto.is_default) {
      await this.supabaseService
        .getAdminClient()
        .from('weekly_templates')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_templates')
      .insert({
        user_id: userId,
        ...dto,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating template: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async update(userId: string, templateId: string, dto: Partial<CreateTemplateDto>) {
    if (dto.is_default) {
      await this.supabaseService
        .getAdminClient()
        .from('weekly_templates')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_templates')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async delete(userId: string, templateId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('weekly_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  // ==================== TEMPLATE BLOCKS ====================

  async addBlock(userId: string, dto: CreateTemplateBlockDto) {
    // Verify template ownership
    const template = await this.findOne(userId, dto.template_id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check for overlaps on same day
    const existingBlocks = (template.blocks ?? []).filter(
      (b: any) => b.day_of_week === dto.day_of_week
    );

    const hasOverlap = existingBlocks.some((block: any) => {
      return dto.start_time < block.end_time && dto.end_time > block.start_time;
    });

    if (hasOverlap) {
      throw new BadRequestException('Block overlaps with existing block on this day');
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('template_blocks')
      .insert(dto)
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

  async updateBlock(userId: string, blockId: string, dto: Partial<CreateTemplateBlockDto>) {
    // First get the block to verify template ownership
    const { data: block } = await this.supabaseService
      .getAdminClient()
      .from('template_blocks')
      .select('template_id')
      .eq('id', blockId)
      .single();

    if (block) {
      await this.findOne(userId, block.template_id); // Throws if not owned
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('template_blocks')
      .update(dto)
      .eq('id', blockId)
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

  async deleteBlock(userId: string, blockId: string) {
    const { data: block } = await this.supabaseService
      .getAdminClient()
      .from('template_blocks')
      .select('template_id')
      .eq('id', blockId)
      .single();

    if (block) {
      await this.findOne(userId, block.template_id);
    }

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('template_blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  async duplicateTemplate(userId: string, templateId: string, newName: string) {
    const original = await this.findOne(userId, templateId);

    // Create new template
    const newTemplate = await this.create(userId, {
      name: newName,
      description: original.description,
      is_default: false,
    });

    // Copy blocks
    const blocks = original.blocks ?? [];
    for (const block of blocks) {
      await this.addBlock(userId, {
        template_id: newTemplate.id,
        category_id: block.category_id,
        day_of_week: block.day_of_week,
        start_time: block.start_time,
        end_time: block.end_time,
        title: block.title,
        notes: block.notes,
        is_flexible: block.is_flexible,
        priority: block.priority,
      });
    }

    return this.findOne(userId, newTemplate.id);
  }
}
