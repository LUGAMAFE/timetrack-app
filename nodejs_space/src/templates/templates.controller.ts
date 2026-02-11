import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, CreateTemplateBlockDto } from './dto';

@ApiTags('Weekly Templates')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  async findAll(@CurrentUser() user: any) {
    return this.templatesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.findOne(user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  async create(@CurrentUser() user: any, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a template' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.delete(user.userId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a template' })
  async duplicate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    return this.templatesService.duplicateTemplate(user.userId, id, name);
  }

  // ==================== BLOCKS ====================

  @Post('blocks')
  @ApiOperation({ summary: 'Add a block to a template' })
  async addBlock(@CurrentUser() user: any, @Body() dto: CreateTemplateBlockDto) {
    return this.templatesService.addBlock(user.userId, dto);
  }

  @Put('blocks/:id')
  @ApiOperation({ summary: 'Update a template block' })
  async updateBlock(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateBlockDto>,
  ) {
    return this.templatesService.updateBlock(user.userId, id, dto);
  }

  @Delete('blocks/:id')
  @ApiOperation({ summary: 'Delete a template block' })
  async deleteBlock(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.deleteBlock(user.userId, id);
  }
}
