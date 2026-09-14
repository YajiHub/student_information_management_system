import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EncodeGradeDto {
  @ApiProperty({ example: 1, description: 'Enrollment record ID' })
  @Type(() => Number)
  @IsInt({ message: 'enrollment_id must be an integer' })
  @IsNotEmpty({ message: 'enrollment_id is required' })
  enrollment_id: number;

  @ApiPropertyOptional({ example: 1.75, description: 'Midterm grade (1.00 - 5.00 grading scale)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'midterm_grade must be a number with at most 2 decimal places' })
  @Min(1.0, { message: 'midterm_grade cannot be less than 1.00' })
  @Max(5.0, { message: 'midterm_grade cannot exceed 5.00' })
  midterm_grade?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Final grade rating (1.00 - 5.00 grading scale)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'final_grade must be a number with at most 2 decimal places' })
  @Min(1.0, { message: 'final_grade cannot be less than 1.00' })
  @Max(5.0, { message: 'final_grade cannot exceed 5.00' })
  final_grade?: number;

  @ApiPropertyOptional({ example: 'PASSED', description: 'Academic remarks (PASSED, FAILED, INCOMPLETE)' })
  @IsOptional()
  @IsString({ message: 'remarks must be a string' })
  remarks?: string;
}
