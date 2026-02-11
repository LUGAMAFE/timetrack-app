import { IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMonthlyGoalDto {
  @ApiProperty()
  @IsString()
  category_id: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 12 })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 160 })
  @IsNumber()
  @Min(0)
  target_hours: number;

  @ApiProperty({ enum: ['minimum', 'maximum'], default: 'minimum' })
  @IsString()
  @IsIn(['minimum', 'maximum'])
  goal_type: 'minimum' | 'maximum';
}

export class CreateWeeklyGoalDto {
  @ApiProperty()
  @IsString()
  category_id: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 7, minimum: 1, maximum: 53 })
  @IsNumber()
  @Min(1)
  @Max(53)
  week_number: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  target_hours: number;

  @ApiProperty({ enum: ['minimum', 'maximum'], default: 'minimum' })
  @IsString()
  @IsIn(['minimum', 'maximum'])
  goal_type: 'minimum' | 'maximum';
}
