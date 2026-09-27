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
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CourseOfferingsService } from './course-offerings.service';
import { CreateCourseOfferingDto } from './dto/create-offering.dto';
import { UpdateCourseOfferingDto } from './dto/update-offering.dto';
import { QueryOfferingsDto } from './dto/query-offerings.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Course Offerings')
@ApiBearerAuth('bearer-jwt')
@Controller('course-offerings')
export class CourseOfferingsController {
  constructor(private readonly offeringsService: CourseOfferingsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Create a new course offering / class section (Admin/Registrar only)' })
  @ApiResponse({ status: 201, description: 'Course offering created successfully' })
  @ApiResponse({ status: 400, description: 'Referenced course, term, or instructor does not exist' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@Body() createOfferingDto: CreateCourseOfferingDto) {
    return this.offeringsService.create(createOfferingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List course offerings (Instructors automatically filtered to assigned sections)' })
  @ApiResponse({ status: 200, description: 'Course offerings retrieved' })
  findAll(
    @Query() query: QueryOfferingsDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.offeringsService.findAll(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a course offering by ID' })
  @ApiResponse({ status: 200, description: 'Course offering details retrieved' })
  @ApiResponse({ status: 404, description: 'Course offering not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.offeringsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Update a course offering (Admin/Registrar only)' })
  @ApiResponse({ status: 200, description: 'Course offering updated' })
  @ApiResponse({ status: 404, description: 'Course offering not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOfferingDto: UpdateCourseOfferingDto,
  ) {
    return this.offeringsService.update(id, updateOfferingDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a course offering (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course offering deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 404, description: 'Course offering not found' })
  @ApiResponse({ status: 409, description: 'Conflict: active student enrollments exist' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.offeringsService.remove(id);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR, Role.STUDENT)
  @ApiOperation({ summary: 'List all students enrolled in a course offering' })
  @ApiResponse({ status: 200, description: 'Enrolled students retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Instructor not assigned to this offering' })
  @ApiResponse({ status: 404, description: 'Course offering not found' })
  getStudents(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.offeringsService.getStudents(id, currentUser);
  }
}
