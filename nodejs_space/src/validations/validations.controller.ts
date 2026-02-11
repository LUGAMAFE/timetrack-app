import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ValidationsService } from './validations.service';
import { ValidateBlockDto } from './dto';

@ApiTags('Block Validations')
@ApiBearerAuth('Supabase-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/validations')
export class ValidationsController {
  constructor(private readonly validationsService: ValidationsService) {}

  @Post('block/:blockId')
  @ApiOperation({ summary: 'Validate a scheduled block' })
  async validateBlock(
    @CurrentUser() user: any,
    @Param('blockId') blockId: string,
    @Body() dto: ValidateBlockDto,
  ) {
    return this.validationsService.validateBlock(user.userId, blockId, dto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending validations' })
  async getPending(@CurrentUser() user: any, @Query('date') date?: string) {
    return this.validationsService.getPendingValidations(user.userId, date);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get validation statistics for a date range' })
  async getStats(
    @CurrentUser() user: any,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.validationsService.getValidationStats(user.userId, startDate, endDate);
  }

  @Get('omission-reasons')
  @ApiOperation({ summary: 'Get list of omission reasons' })
  async getOmissionReasons() {
    return this.validationsService.getOmissionReasons();
  }
}
