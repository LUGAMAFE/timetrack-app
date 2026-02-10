import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/user.decorator';

@ApiTags('Categories')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories for authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of categories' })
  async findAll(@CurrentUser() user: AuthUser) {
    const categories = await this.categoriesService.findAll(user.userId);
    return { categories };
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(user.userId, dto);
    return { category };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(user.userId, id, dto);
    return { category };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category (non-default only)' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categoriesService.delete(user.userId, id);
  }

  @Post('seed-defaults')
  @ApiOperation({ summary: 'Seed default categories for new user' })
  @ApiResponse({ status: 201, description: 'Default categories seeded' })
  async seedDefaults(@CurrentUser() user: AuthUser) {
    const categories = await this.categoriesService.seedDefaults(user.userId);
    return { categories };
  }
}
