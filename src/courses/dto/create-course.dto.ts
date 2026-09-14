import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordStatus } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'IT312', description: 'Unique course/subject code' })
  @IsString({ message: 'course_code must be a string' })
  @IsNotEmpty({ message: 'course_code is required' })
  course_code: string;

  @ApiProperty({ example: 'Web Systems and Technologies 2', description: 'Course title' })
  @IsString({ message: 'course_title must be a string' })
  @IsNotEmpty({ message: 'course_title is required' })
  course_title: string;

  @ApiPropertyOptional({ example: 'Advanced client-side and server-side web development', description: 'Course description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({ example: 3, description: 'Academic credit units', default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'units must be an integer' })
  @Min(1, { message: 'units must be at least 1' })
  @Max(6, { message: 'units cannot exceed 6' })
  units?: number = 3;

  @ApiPropertyOptional({ enum: RecordStatus, default: RecordStatus.ACTIVE })
  @IsOptional()
  @IsEnum(RecordStatus, { message: 'status must be a valid RecordStatus' })
  status?: RecordStatus;
}
