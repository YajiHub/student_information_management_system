import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryOfferingsDto {
  @ApiPropertyOptional({ description: 'Filter by Course ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  course_id?: number;

  @ApiPropertyOptional({ description: 'Filter by Academic Term ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  academic_term_id?: number;

  @ApiPropertyOptional({ description: 'Filter by Instructor (User) ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  instructor_id?: number;

  @ApiPropertyOptional({ description: 'Filter by section name' })
  @IsOptional()
  @IsString()
  section?: string;
}
