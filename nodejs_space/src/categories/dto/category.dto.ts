import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Reading' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'book' })
  @IsString()
  icon: string;

  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  color: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_goal_hours?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_limit_hours?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Reading' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'book' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_goal_hours?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_limit_hours?: number;
}

export class CategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() icon: string;
  @ApiProperty() color: string;
  @ApiPropertyOptional() monthly_goal_hours?: number;
  @ApiPropertyOptional() monthly_limit_hours?: number;
  @ApiProperty() is_default: boolean;
  @ApiProperty() created_at: string;
}
