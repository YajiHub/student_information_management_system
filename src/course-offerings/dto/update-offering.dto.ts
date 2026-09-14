import { PartialType } from '@nestjs/swagger';
import { CreateCourseOfferingDto } from './create-offering.dto';

export class UpdateCourseOfferingDto extends PartialType(CreateCourseOfferingDto) {}
