import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthUser } from '../auth/user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly statistics' })
  @ApiQuery({ name: 'month', required: true, example: '2024-01', description: 'Month in YYYY-MM format' })
  @ApiResponse({ status: 200, description: 'Returns monthly statistics' })
  async getMonthlyStats(@CurrentUser() user: AuthUser, @Query('month') month: string) {
    return this.dashboardService.getMonthlyStats(user.userId, month);
  }
}
