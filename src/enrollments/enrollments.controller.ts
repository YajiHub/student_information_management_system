import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Enrollments')
@ApiBearerAuth('bearer-jwt')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Enroll a student into a course offering (Admin/Registrar only)' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 400, description: 'Capacity reached, max units exceeded, or invalid references' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 409, description: 'Conflict: student is already enrolled in this offering' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all enrollments with optional filters' })
  @ApiQuery({ name: 'student_id', required: false, type: Number })
  @ApiQuery({ name: 'course_offering_id', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  findAll(
    @Query('student_id') studentId?: string,
    @Query('course_offering_id') offeringId?: string,
    @Query('status') status?: string,
  ) {
    return this.enrollmentsService.findAll(
      studentId ? parseInt(studentId, 10) : undefined,
      offeringId ? parseInt(offeringId, 10) : undefined,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve enrollment details by ID' })
  @ApiResponse({ status: 200, description: 'Enrollment details retrieved' })
  @ApiResponse({ status: 404, description: 'Enrollment record not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Update enrollment status (e.g. DROPPED, COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Enrollment status updated' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Cancel/delete an enrollment (Admin/Registrar only)' })
  @ApiResponse({ status: 200, description: 'Enrollment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete enrollment with recorded grades' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.remove(id);
  }
}
