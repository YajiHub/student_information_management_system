import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StudentStatus, StudentType } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: '2026-00001', description: 'Unique student number in YYYY-NNNNN format' })
  @IsString({ message: 'student_number must be a string' })
  @IsNotEmpty({ message: 'student_number is required' })
  @Matches(/^\d{4}-\d{5}$/, { message: 'student_number must be formatted as YYYY-NNNNN (e.g. 2026-00001)' })
  student_number: string;

  @ApiProperty({ example: 'Juan', description: 'First name' })
  @IsString({ message: 'first_name must be a string' })
  @IsNotEmpty({ message: 'first_name is required' })
  first_name: string;

  @ApiPropertyOptional({ example: 'Protacio', description: 'Middle name' })
  @IsOptional()
  @IsString({ message: 'middle_name must be a string' })
  middle_name?: string;

  @ApiProperty({ example: 'Dela Cruz', description: 'Last name' })
  @IsString({ message: 'last_name must be a string' })
  @IsNotEmpty({ message: 'last_name is required' })
  last_name: string;

  @ApiPropertyOptional({ example: 'Jr.', description: 'Name suffix (Jr., III, etc.)' })
  @IsOptional()
  @IsString({ message: 'suffix must be a string' })
  suffix?: string;

  @ApiProperty({ example: '2004-06-19T00:00:00.000Z', description: 'Birth date' })
  @IsDateString({}, { message: 'birth_date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'birth_date is required' })
  birth_date: string;

  @ApiProperty({ example: 'juan.delacruz@sims.edu', description: 'Student official email' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiPropertyOptional({ example: '+639171234567', description: 'Contact mobile number' })
  @IsOptional()
  @IsString({ message: 'contact_number must be a string' })
  contact_number?: string;

  @ApiPropertyOptional({ example: '123 Sampaguita St, Manila', description: 'Residential address' })
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string;

  @ApiProperty({ example: 1, description: 'ID of academic program' })
  @Type(() => Number)
  @IsInt({ message: 'program_id must be an integer' })
  @IsNotEmpty({ message: 'program_id is required' })
  program_id: number;

  @ApiPropertyOptional({ example: 5, description: 'Linked system user ID for student portal access' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'user_id must be an integer' })
  user_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Current year level (1-4)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'year_level must be an integer' })
  @Min(1, { message: 'year_level must be at least 1' })
  @Max(5, { message: 'year_level cannot exceed 5' })
  year_level?: number = 1;

  @ApiPropertyOptional({ enum: StudentType, default: StudentType.REGULAR, description: 'Student academic load classification' })
  @IsOptional()
  @IsEnum(StudentType, { message: 'student_type must be REGULAR or IRREGULAR' })
  student_type?: StudentType = StudentType.REGULAR;

  @ApiPropertyOptional({ example: 24, description: 'Maximum allowed academic units for the term', default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'max_allowed_units must be an integer' })
  @Min(3, { message: 'max_allowed_units must be at least 3' })
  @Max(30, { message: 'max_allowed_units cannot exceed 30' })
  max_allowed_units?: number = 24;

  @ApiPropertyOptional({ enum: StudentStatus, default: StudentStatus.ACTIVE, description: 'Current enrollment status' })
  @IsOptional()
  @IsEnum(StudentStatus, { message: 'status must be a valid StudentStatus' })
  status?: StudentStatus = StudentStatus.ACTIVE;
}
