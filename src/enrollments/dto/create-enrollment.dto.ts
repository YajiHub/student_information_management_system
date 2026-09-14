import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 1, description: 'Student ID to enroll' })
  @Type(() => Number)
  @IsInt({ message: 'student_id must be an integer' })
  @IsNotEmpty({ message: 'student_id is required' })
  student_id: number;

  @ApiProperty({ example: 1, description: 'Course Offering ID' })
  @Type(() => Number)
  @IsInt({ message: 'course_offering_id must be an integer' })
  @IsNotEmpty({ message: 'course_offering_id is required' })
  course_offering_id: number;

  @ApiPropertyOptional({ example: '2026-08-20T00:00:00.000Z', description: 'Date of enrollment' })
  @IsOptional()
  @IsDateString({}, { message: 'enrollment_date must be a valid ISO date string' })
  enrollment_date?: string;

  @ApiPropertyOptional({ enum: EnrollmentStatus, default: EnrollmentStatus.ENROLLED })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: 'status must be ENROLLED, DROPPED, or COMPLETED' })
  status?: EnrollmentStatus = EnrollmentStatus.ENROLLED;
}
