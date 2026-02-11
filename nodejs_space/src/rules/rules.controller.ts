import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { RulesService } from './rules.service';
import { CreateRestRuleDto, CreateUsageLimitDto } from './dto';

@ApiTags('Rules & Limits')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  // ==================== REST RULES ====================

  @Get('rest')
  @ApiOperation({ summary: 'Get rest rules' })
  async getRestRules(@CurrentUser() user: any) {
    return this.rulesService.getRestRules(user.userId);
  }

  @Post('rest')
  @ApiOperation({ summary: 'Create a rest rule' })
  async createRestRule(@CurrentUser() user: any, @Body() dto: CreateRestRuleDto) {
    return this.rulesService.createRestRule(user.userId, dto);
  }

  @Put('rest/:id')
  @ApiOperation({ summary: 'Update a rest rule' })
  async updateRestRule(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateRestRuleDto & { is_active: boolean }>,
  ) {
    return this.rulesService.updateRestRule(user.userId, id, dto);
  }

  @Delete('rest/:id')
  @ApiOperation({ summary: 'Delete a rest rule' })
  async deleteRestRule(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rulesService.deleteRestRule(user.userId, id);
  }

  // ==================== USAGE LIMITS ====================

  @Get('limits')
  @ApiOperation({ summary: 'Get usage limits' })
  async getUsageLimits(@CurrentUser() user: any) {
    return this.rulesService.getUsageLimits(user.userId);
  }

  @Post('limits')
  @ApiOperation({ summary: 'Create or update a usage limit' })
  async createUsageLimit(@CurrentUser() user: any, @Body() dto: CreateUsageLimitDto) {
    return this.rulesService.createUsageLimit(user.userId, dto);
  }

  @Put('limits/:id')
  @ApiOperation({ summary: 'Update a usage limit' })
  async updateUsageLimit(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateUsageLimitDto & { is_active: boolean }>,
  ) {
    return this.rulesService.updateUsageLimit(user.userId, id, dto);
  }

  @Delete('limits/:id')
  @ApiOperation({ summary: 'Delete a usage limit' })
  async deleteUsageLimit(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rulesService.deleteUsageLimit(user.userId, id);
  }

  // ==================== VIOLATIONS ====================

  @Get('violations')
  @ApiOperation({ summary: 'Get violations' })
  async getViolations(
    @CurrentUser() user: any,
    @Query('acknowledged') acknowledged?: string,
  ) {
    const ack = acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined;
    return this.rulesService.getViolations(user.userId, ack);
  }

  @Post('violations/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a violation' })
  async acknowledgeViolation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rulesService.acknowledgeViolation(user.userId, id);
  }

  @Post('violations/acknowledge-all')
  @ApiOperation({ summary: 'Acknowledge all violations' })
  async acknowledgeAllViolations(@CurrentUser() user: any) {
    return this.rulesService.acknowledgeAllViolations(user.userId);
  }

  // ==================== RULE CHECKING ====================

  @Post('check')
  @ApiOperation({ summary: 'Check if a block violates any rules' })
  async checkBlockViolations(
    @CurrentUser() user: any,
    @Body() body: { date: string; category_id: string; start_time: string; end_time: string },
  ) {
    return this.rulesService.checkBlockViolations(
      user.userId,
      body.date,
      body.category_id,
      body.start_time,
      body.end_time,
    );
  }
}
