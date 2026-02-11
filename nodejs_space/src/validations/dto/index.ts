import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateBlockDto {
  @ApiProperty({ enum: ['completed', 'partial', 'omitted'] })
  @IsString()
  @IsIn(['completed', 'partial', 'omitted'])
  status: 'completed' | 'partial' | 'omitted';

  @ApiPropertyOptional({ example: '09:05' })
  @IsOptional()
  @IsString()
  actual_start_time?: string;

  @ApiPropertyOptional({ example: '12:15' })
  @IsOptional()
  @IsString()
  actual_end_time?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completion_percentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  omission_reason_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  omission_notes?: string;
}
