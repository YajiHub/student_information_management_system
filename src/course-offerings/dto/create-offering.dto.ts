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

export class CreateCourseOfferingDto {
  @ApiProperty({ example: 1, description: 'Course ID' })
  @Type(() => Number)
  @IsInt({ message: 'course_id must be an integer' })
  @IsNotEmpty({ message: 'course_id is required' })
  course_id: number;

  @ApiProperty({ example: 1, description: 'Academic Term ID' })
  @Type(() => Number)
  @IsInt({ message: 'academic_term_id must be an integer' })
  @IsNotEmpty({ message: 'academic_term_id is required' })
  academic_term_id: number;

  @ApiProperty({ example: 3, description: 'Instructor (User) ID' })
  @Type(() => Number)
  @IsInt({ message: 'instructor_id must be an integer' })
  @IsNotEmpty({ message: 'instructor_id is required' })
  instructor_id: number;

  @ApiProperty({ example: '4A', description: 'Class section name/code' })
  @IsString({ message: 'section must be a string' })
  @IsNotEmpty({ message: 'section is required' })
  section: string;

  @ApiProperty({ example: 'MW 09:00 - 10:30', description: 'Weekly class schedule' })
  @IsString({ message: 'schedule must be a string' })
  @IsNotEmpty({ message: 'schedule is required' })
  schedule: string;

  @ApiProperty({ example: 'Computer Lab 3', description: 'Classroom / Laboratory room' })
  @IsString({ message: 'room must be a string' })
  @IsNotEmpty({ message: 'room is required' })
  room: string;

  @ApiPropertyOptional({ example: 40, description: 'Maximum student capacity', default: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'capacity must be an integer' })
  @Min(1, { message: 'capacity must be at least 1' })
  @Max(200, { message: 'capacity cannot exceed 200' })
  capacity?: number = 40;

  @ApiPropertyOptional({ enum: RecordStatus, default: RecordStatus.ACTIVE })
  @IsOptional()
  @IsEnum(RecordStatus, { message: 'status must be a valid RecordStatus' })
  status?: RecordStatus = RecordStatus.ACTIVE;
}
