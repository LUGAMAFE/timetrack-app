import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestRuleDto {
  @ApiPropertyOptional({ description: 'Category ID (null means all categories)' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ example: 90, description: 'Trigger rest after this many minutes' })
  @IsNumber()
  @Min(1)
  trigger_duration_minutes: number;

  @ApiProperty({ example: 15, default: 15 })
  @IsNumber()
  @Min(1)
  rest_duration_minutes: number;

  @ApiPropertyOptional({ description: 'Category to use for rest block' })
  @IsOptional()
  @IsString()
  rest_category_id?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;
}

export class CreateUsageLimitDto {
  @ApiProperty()
  @IsString()
  category_id: string;

  @ApiProperty({ example: 60, description: 'Maximum continuous minutes' })
  @IsNumber()
  @Min(1)
  max_continuous_minutes: number;

  @ApiPropertyOptional({ example: 4, description: 'Maximum daily hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_daily_hours?: number;

  @ApiPropertyOptional({ example: 20, description: 'Maximum weekly hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_weekly_hours?: number;
}
