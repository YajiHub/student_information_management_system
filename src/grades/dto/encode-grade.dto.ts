import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export const VALID_GRADE_VALUES = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 4.0, 5.0];

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
  @IsIn(VALID_GRADE_VALUES, {
    message: 'midterm_grade must be a valid academic mark (1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 4.00, 5.00)',
  })
  midterm_grade?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Final grade rating (1.00 - 5.00 grading scale)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'final_grade must be a number with at most 2 decimal places' })
  @IsIn(VALID_GRADE_VALUES, {
    message: 'final_grade must be a valid academic mark (1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 4.00, 5.00)',
  })
  final_grade?: number;

  @ApiPropertyOptional({ example: 'PASSED', description: 'Academic remarks (PASSED, FAILED, INCOMPLETE)' })
  @IsOptional()
  @IsString({ message: 'remarks must be a string' })
  remarks?: string;
}
