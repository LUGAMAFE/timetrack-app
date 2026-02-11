import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { GoalsService } from './goals.service';
import { CreateMonthlyGoalDto, CreateWeeklyGoalDto } from './dto';

@ApiTags('Goals')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // ==================== MONTHLY ====================

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly goals' })
  async getMonthlyGoals(
    @CurrentUser() user: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) : undefined;
    return this.goalsService.getMonthlyGoals(user.userId, yearNum, monthNum);
  }

  @Post('monthly')
  @ApiOperation({ summary: 'Create or update monthly goal' })
  async createMonthlyGoal(@CurrentUser() user: any, @Body() dto: CreateMonthlyGoalDto) {
    return this.goalsService.createMonthlyGoal(user.userId, dto);
  }

  @Delete('monthly/:id')
  @ApiOperation({ summary: 'Delete monthly goal' })
  async deleteMonthlyGoal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.deleteMonthlyGoal(user.userId, id);
  }

  @Get('monthly/progress')
  @ApiOperation({ summary: 'Get monthly progress with goals' })
  async getMonthlyProgress(
    @CurrentUser() user: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) : undefined;
    return this.goalsService.getMonthlyProgress(user.userId, yearNum, monthNum);
  }

  // ==================== WEEKLY ====================

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly goals' })
  async getWeeklyGoals(
    @CurrentUser() user: any,
    @Query('year') year?: string,
    @Query('week') week?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const weekNum = week ? parseInt(week, 10) : undefined;
    return this.goalsService.getWeeklyGoals(user.userId, yearNum, weekNum);
  }

  @Post('weekly')
  @ApiOperation({ summary: 'Create or update weekly goal' })
  async createWeeklyGoal(@CurrentUser() user: any, @Body() dto: CreateWeeklyGoalDto) {
    return this.goalsService.createWeeklyGoal(user.userId, dto);
  }

  @Delete('weekly/:id')
  @ApiOperation({ summary: 'Delete weekly goal' })
  async deleteWeeklyGoal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.deleteWeeklyGoal(user.userId, id);
  }

  @Get('weekly/progress')
  @ApiOperation({ summary: 'Get weekly progress with goals' })
  async getWeeklyProgress(
    @CurrentUser() user: any,
    @Query('year') year?: string,
    @Query('week') week?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const weekNum = week ? parseInt(week, 10) : undefined;
    return this.goalsService.getWeeklyProgress(user.userId, yearNum, weekNum);
  }
}
