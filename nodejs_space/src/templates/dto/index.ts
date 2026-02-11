import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class CreateTemplateBlockDto {
  @ApiProperty()
  @IsString()
  template_id: string;

  @ApiProperty()
  @IsString()
  category_id: string;

  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: '0=Sunday, 6=Saturday' })
  @IsNumber()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  start_time: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  end_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_flexible?: boolean;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;
}
