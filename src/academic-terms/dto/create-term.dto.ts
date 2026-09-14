import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { RecordStatus, Semester } from '@prisma/client';

export class CreateAcademicTermDto {
  @ApiProperty({ example: '2026-2027', description: 'Academic year format YYYY-YYYY' })
  @IsString({ message: 'academic_year must be a string' })
  @IsNotEmpty({ message: 'academic_year is required' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'academic_year must be in format YYYY-YYYY (e.g. 2026-2027)' })
  academic_year: string;

  @ApiProperty({ enum: Semester, example: Semester.FIRST_SEMESTER, description: 'Semester classification' })
  @IsEnum(Semester, { message: 'semester must be FIRST_SEMESTER, SECOND_SEMESTER, or SUMMER' })
  @IsNotEmpty({ message: 'semester is required' })
  semester: Semester;

  @ApiProperty({ example: '2026-08-15T00:00:00.000Z', description: 'Term start date' })
  @IsDateString({}, { message: 'start_date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'start_date is required' })
  start_date: string;

  @ApiProperty({ example: '2026-12-20T00:00:00.000Z', description: 'Term end date' })
  @IsDateString({}, { message: 'end_date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'end_date is required' })
  end_date: string;

  @ApiPropertyOptional({ enum: RecordStatus, default: RecordStatus.ACTIVE })
  @IsOptional()
  @IsEnum(RecordStatus, { message: 'status must be a valid RecordStatus' })
  status?: RecordStatus;
}
