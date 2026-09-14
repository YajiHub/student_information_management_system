import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus, example: EnrollmentStatus.DROPPED })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: 'status must be ENROLLED, DROPPED, or COMPLETED' })
  status?: EnrollmentStatus;
}
