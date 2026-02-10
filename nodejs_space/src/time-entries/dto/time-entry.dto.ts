import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTimeEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  end_time: string;

  @ApiPropertyOptional({ example: 'Morning workout' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsString()
  date: string;
}

export class UpdateTimeEntryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: '2024-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ example: 'Morning workout' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  date?: string;
}

export class TimeEntryQueryDto {
  @ApiPropertyOptional({ example: '2024-01', description: 'Filter by month (YYYY-MM)' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
