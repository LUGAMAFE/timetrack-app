import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto, TimeEntryQueryDto } from './dto/time-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/user.decorator';

@ApiTags('Time Entries')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'List time entries with optional filters' })
  @ApiQuery({ name: 'month', required: false, example: '2024-01' })
  @ApiQuery({ name: 'category_id', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of time entries' })
  async findAll(@CurrentUser() user: AuthUser, @Query() query: TimeEntryQueryDto) {
    const entries = await this.timeEntriesService.findAll(user.userId, query);
    return { entries };
  }

  @Post()
  @ApiOperation({ summary: 'Create time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTimeEntryDto) {
    const entry = await this.timeEntriesService.create(user.userId, dto);
    return { entry };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
  ) {
    const entry = await this.timeEntriesService.update(user.userId, id, dto);
    return { entry };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 200, description: 'Time entry deleted' })
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.timeEntriesService.delete(user.userId, id);
  }
}
