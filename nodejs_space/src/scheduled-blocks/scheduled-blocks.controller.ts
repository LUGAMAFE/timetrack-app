import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ScheduledBlocksService } from './scheduled-blocks.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';

@ApiTags('Scheduled Blocks')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/blocks')
export class ScheduledBlocksController {
  constructor(private readonly blocksService: ScheduledBlocksService) {}

  @Get('date/:date')
  @ApiOperation({ summary: 'Get blocks for a specific date' })
  async getByDate(@CurrentUser() user: any, @Param('date') date: string) {
    return this.blocksService.findByDate(user.userId, date);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get blocks for a date range' })
  async getByRange(
    @CurrentUser() user: any,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.blocksService.findByDateRange(user.userId, startDate, endDate);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new scheduled block' })
  async create(@CurrentUser() user: any, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a scheduled block' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.blocksService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scheduled block' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.blocksService.delete(user.userId, id);
  }

  @Post('apply-template')
  @ApiOperation({ summary: 'Apply a weekly template to a specific week' })
  async applyTemplate(
    @CurrentUser() user: any,
    @Body() body: { templateId: string; weekStartDate: string },
  ) {
    return this.blocksService.applyTemplate(user.userId, body.templateId, body.weekStartDate);
  }
}
