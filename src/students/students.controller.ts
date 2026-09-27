import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth('bearer-jwt')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Create a new student record (Admin/Registrar only)' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Referenced program does not exist' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 409, description: 'Duplicate student number or email' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List students with search, filters, sorting, and pagination' })
  @ApiResponse({ status: 200, description: 'Students collection retrieved' })
  findAll(@Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve student details by ID (Admin, Registrar, or Owner Student)' })
  @ApiResponse({ status: 200, description: 'Student details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot access another student profile' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.studentsService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Update a student record (Admin/Registrar only)' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Conflict: duplicate student number or email' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Partially update a student record (Admin/Registrar only)' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Conflict: duplicate student number or email' })
  partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a student record (Admin only)' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Conflict: active enrollments exist' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }

  @Get(':id/enrollments')
  @ApiOperation({ summary: 'Retrieve student enrollments (Admin, Registrar, or Owner Student)' })
  @ApiResponse({ status: 200, description: 'Student enrollments retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot access another student enrollments' })
  getEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.studentsService.getEnrollments(id, currentUser);
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Retrieve student grade sheet (Admin, Registrar, or Owner Student)' })
  @ApiResponse({ status: 200, description: 'Student grades retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot access another student grades' })
  getGrades(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.studentsService.getGrades(id, currentUser);
  }

  @Get(':id/academic-record')
  @ApiOperation({ summary: 'Retrieve aggregated student academic transcript by term (Admin, Registrar, or Owner Student)' })
  @ApiResponse({ status: 200, description: 'Academic record report retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot access another student academic record' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getAcademicRecord(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.studentsService.getAcademicRecord(id, currentUser);
  }
}
