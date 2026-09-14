import { PartialType } from '@nestjs/swagger';
import { CreateAcademicTermDto } from './create-term.dto';

export class UpdateAcademicTermDto extends PartialType(CreateAcademicTermDto) {}
