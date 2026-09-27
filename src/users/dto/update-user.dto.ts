import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * All fields optional. Provide `password` to rotate credentials, provide
 * `student_id` to (re)link a student record, omit it to leave linking as-is.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
