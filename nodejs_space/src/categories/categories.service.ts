import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Sleep', icon: 'moon', color: '#6366F1' },
  { name: 'Sport', icon: 'fitness', color: '#10B981' },
  { name: 'Work', icon: 'briefcase', color: '#F59E0B' },
  { name: 'Leisure', icon: 'game-controller', color: '#EC4899' },
  { name: 'Pets', icon: 'paw', color: '#8B5CF6' },
  { name: 'Finance', icon: 'cash', color: '#14B8A6' },
];

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findAll(userId: string) {
    this.logger.log(`Fetching categories for user: ${userId}`);
    
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching categories: ${error.message}`, error);
      throw new BadRequestException(error.message);
    }
    this.logger.log(`Found ${data?.length ?? 0} categories`);
    return data ?? [];
  }

  async create(userId: string, dto: CreateCategoryDto) {
    this.logger.log(`Creating category for user ${userId}: ${JSON.stringify(dto)}`);
    
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('categories')
      .insert({
        user_id: userId,
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        monthly_goal_hours: dto.monthly_goal_hours ?? null,
        monthly_limit_hours: dto.monthly_limit_hours ?? null,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating category: ${error.message}`, error);
      throw new BadRequestException(error.message);
    }
    this.logger.log(`Category created successfully: ${data?.id}`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('categories')
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating category: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Category not found');
    return data;
  }

  async delete(userId: string, id: string) {
    // Check if it's a default category
    const { data: category } = await this.supabaseService
      .getAdminClient()
      .from('categories')
      .select('is_default')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!category) throw new NotFoundException('Category not found');
    if (category.is_default) throw new BadRequestException('Cannot delete default categories');

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting category: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }

  async seedDefaults(userId: string) {
    this.logger.log(`Seeding defaults for user: ${userId}`);
    
    // Use upsert to prevent duplicates - check by user_id and name
    const results = [];
    
    for (const cat of DEFAULT_CATEGORIES) {
      const { data, error } = await this.supabaseService
        .getAdminClient()
        .from('categories')
        .upsert(
          {
            user_id: userId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            is_default: true,
          },
          {
            onConflict: 'user_id,name',
            ignoreDuplicates: true,
          }
        )
        .select()
        .single();

      if (!error && data) {
        results.push(data);
      }
    }

    this.logger.log(`Seeded/verified ${results.length} categories`);
    return await this.findAll(userId);
  }
}
