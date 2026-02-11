import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { AiService } from './ai.service';

@ApiTags('AI Coaching')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze/feasibility')
  @ApiOperation({ summary: 'Analyze weekly routine feasibility' })
  async analyzeFeasibility(
    @CurrentUser() user: any,
    @Query('weekStart') weekStart: string,
  ) {
    return this.aiService.analyzeFeasibility(user.userId, weekStart);
  }

  @Post('analyze/predictions')
  @ApiOperation({ summary: 'Generate predictive alerts for upcoming blocks' })
  async generatePredictions(@CurrentUser() user: any) {
    return this.aiService.generatePredictiveAlerts(user.userId);
  }

  @Post('analyze/time-leaks')
  @ApiOperation({ summary: 'Analyze time leaks and patterns' })
  async analyzeTimeLeaks(@CurrentUser() user: any) {
    return this.aiService.analyzeTimeLeaks(user.userId);
  }

  @Post('analyze/recovery')
  @ApiOperation({ summary: 'Suggest recovery routine for behind goals' })
  async suggestRecovery(@CurrentUser() user: any) {
    return this.aiService.suggestRecoveryRoutine(user.userId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI-generated insights' })
  async getInsights(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('includeRead') includeRead?: string,
  ) {
    return this.aiService.getInsights(user.userId, type, includeRead === 'true');
  }

  @Post('insights/:id/read')
  @ApiOperation({ summary: 'Mark insight as read' })
  async markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.aiService.markInsightRead(user.userId, id);
  }

  @Post('insights/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss an insight' })
  async dismiss(@CurrentUser() user: any, @Param('id') id: string) {
    return this.aiService.dismissInsight(user.userId, id);
  }
}
