import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
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
import { GradesService } from './grades.service';
import { EncodeGradeDto } from './dto/encode-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Grades')
@ApiBearerAuth('bearer-jwt')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Encode midterm and final grades for an enrollment (Authorized Instructor or Admin)' })
  @ApiResponse({ status: 201, description: 'Grade encoded successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Instructor not assigned to this course offering' })
  @ApiResponse({ status: 404, description: 'Enrollment record not found' })
  @ApiResponse({ status: 409, description: 'Grade already encoded; use PUT to update' })
  @ApiResponse({ status: 422, description: 'Validation error in grade limits' })
  encode(
    @Body() encodeGradeDto: EncodeGradeDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.gradesService.encode(encodeGradeDto, currentUser);
  }

  @Get()
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List grades (Instructors filtered to assigned sections)' })
  @ApiQuery({ name: 'enrollment_id', required: false, type: Number })
  @ApiQuery({ name: 'student_id', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Grades list retrieved' })
  findAll(
    @CurrentUser() currentUser: any,
    @Query('enrollment_id') enrollmentId?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.gradesService.findAll(
      currentUser,
      enrollmentId ? parseInt(enrollmentId, 10) : undefined,
      studentId ? parseInt(studentId, 10) : undefined,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Retrieve grade record by ID' })
  @ApiResponse({ status: 200, description: 'Grade record retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized instructors' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.gradesService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update an existing grade record (Authorized Instructor or Admin)' })
  @ApiResponse({ status: 200, description: 'Grade updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Instructor not assigned to this course offering' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradeDto: UpdateGradeDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.gradesService.update(id, updateGradeDto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a grade record (Admin only)' })
  @ApiResponse({ status: 200, description: 'Grade record deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin roles' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.remove(id);
  }
}
