import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RecordStatus } from '@prisma/client';

export class CreateProgramDto {
  @ApiProperty({ example: 'BSIT', description: 'Unique academic program code' })
  @IsString({ message: 'code must be a string' })
  @IsNotEmpty({ message: 'code is required' })
  code: string;

  @ApiProperty({ example: 'Bachelor of Science in Information Technology', description: 'Program title/name' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Undergraduate degree focusing on software development and networks', description: 'Detailed program description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({ enum: RecordStatus, default: RecordStatus.ACTIVE })
  @IsOptional()
  @IsEnum(RecordStatus, { message: 'status must be a valid RecordStatus' })
  status?: RecordStatus;
}
