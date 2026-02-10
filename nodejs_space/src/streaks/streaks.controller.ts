import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StreaksService } from './streaks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/user.decorator';

@ApiTags('Streaks')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get()
  @ApiOperation({ summary: "Get user's streak data" })
  @ApiResponse({ status: 200, description: 'Returns streak data' })
  async getStreak(@CurrentUser() user: AuthUser) {
    return this.streaksService.getStreak(user.userId);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update streak after logging time' })
  @ApiResponse({ status: 200, description: 'Returns updated streak data' })
  async updateStreak(@CurrentUser() user: AuthUser) {
    return this.streaksService.updateStreak(user.userId);
  }
}
