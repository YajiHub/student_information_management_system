import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Santos', description: 'Full display name' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiProperty({ example: 'santos.j@university.edu', description: 'Unique institutional email' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({ example: 'FacultyPass123!', description: 'Plain password (min 8 characters)' })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.INSTRUCTOR, description: 'System role' })
  @IsEnum(Role, { message: 'role must be ADMIN, REGISTRAR, INSTRUCTOR, or STUDENT' })
  role: Role;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'status must be ACTIVE or INACTIVE' })
  status?: UserStatus;

  @ApiPropertyOptional({ example: 7, description: 'Link this account to an existing student record' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'student_id must be an integer' })
  student_id?: number;
}
