import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { StudentStatus, StudentType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryStudentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by program ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  program_id?: number;

  @ApiPropertyOptional({ description: 'Filter by year level (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  year_level?: number;

  @ApiPropertyOptional({ enum: StudentStatus, description: 'Filter by student status' })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ enum: StudentType, description: 'Filter by REGULAR or IRREGULAR classification' })
  @IsOptional()
  @IsEnum(StudentType)
  student_type?: StudentType;
}
