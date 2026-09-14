import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseOfferingDto } from './dto/create-offering.dto';
import { UpdateCourseOfferingDto } from './dto/update-offering.dto';
import { QueryOfferingsDto } from './dto/query-offerings.dto';

@Injectable()
export class CourseOfferingsService {
  constructor(private prisma: PrismaService) {}

  async create(createOfferingDto: CreateCourseOfferingDto) {
    const [course, term, instructor] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: createOfferingDto.course_id } }),
      this.prisma.academicTerm.findUnique({ where: { id: createOfferingDto.academic_term_id } }),
      this.prisma.user.findUnique({ where: { id: createOfferingDto.instructor_id } }),
    ]);

    if (!course) {
      throw new BadRequestException(`Course with ID ${createOfferingDto.course_id} does not exist.`);
    }

    if (!term) {
      throw new BadRequestException(`Academic term with ID ${createOfferingDto.academic_term_id} does not exist.`);
    }

    if (!instructor) {
      throw new BadRequestException(`Instructor user with ID ${createOfferingDto.instructor_id} does not exist.`);
    }

    const offering = await this.prisma.courseOffering.create({
      data: createOfferingDto,
      include: {
        course: true,
        academic_term: true,
        instructor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return {
      message: 'Course offering created successfully.',
      data: offering,
    };
  }

  async findAll(query: QueryOfferingsDto, currentUser?: any) {
    const where: Prisma.CourseOfferingWhereInput = {};

    // If logged in as Instructor, restrict to their assigned course offerings
    if (currentUser && currentUser.role === Role.INSTRUCTOR) {
      where.instructor_id = currentUser.id;
    } else if (query.instructor_id) {
      where.instructor_id = query.instructor_id;
    }

    if (query.course_id) {
      where.course_id = query.course_id;
    }

    if (query.academic_term_id) {
      where.academic_term_id = query.academic_term_id;
    }

    if (query.section) {
      where.section = query.section;
    }

    const offerings = await this.prisma.courseOffering.findMany({
      where,
      include: {
        course: true,
        academic_term: true,
        instructor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: [{ academic_term_id: 'desc' }, { section: 'asc' }],
    });

    return {
      message: 'Course offerings retrieved successfully.',
      data: offerings,
    };
  }

  async findOne(id: number) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id },
      include: {
        course: true,
        academic_term: true,
        instructor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!offering) {
      throw new NotFoundException(`Course offering with ID ${id} not found.`);
    }

    return {
      message: 'Course offering retrieved successfully.',
      data: offering,
    };
  }

  async update(id: number, updateOfferingDto: UpdateCourseOfferingDto) {
    await this.findOne(id);

    if (updateOfferingDto.course_id) {
      const course = await this.prisma.course.findUnique({ where: { id: updateOfferingDto.course_id } });
      if (!course) throw new BadRequestException(`Course with ID ${updateOfferingDto.course_id} does not exist.`);
    }

    if (updateOfferingDto.academic_term_id) {
      const term = await this.prisma.academicTerm.findUnique({ where: { id: updateOfferingDto.academic_term_id } });
      if (!term) throw new BadRequestException(`Academic term with ID ${updateOfferingDto.academic_term_id} does not exist.`);
    }

    if (updateOfferingDto.instructor_id) {
      const instructor = await this.prisma.user.findUnique({ where: { id: updateOfferingDto.instructor_id } });
      if (!instructor) throw new BadRequestException(`Instructor with ID ${updateOfferingDto.instructor_id} does not exist.`);
    }

    const updated = await this.prisma.courseOffering.update({
      where: { id },
      data: updateOfferingDto,
      include: {
        course: true,
        academic_term: true,
        instructor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      message: 'Course offering updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const enrollmentCount = await this.prisma.enrollment.count({
      where: { course_offering_id: id },
    });

    if (enrollmentCount > 0) {
      throw new ConflictException(
        `Cannot delete course offering because it has ${enrollmentCount} active student enrollment(s).`,
      );
    }

    await this.prisma.courseOffering.delete({
      where: { id },
    });

    return {
      message: 'Course offering deleted successfully.',
      data: null,
    };
  }

  async getStudents(id: number, currentUser?: any) {
    const offering = await this.findOne(id);

    // If user is Instructor, check if assigned to this offering
    if (currentUser && currentUser.role === Role.INSTRUCTOR) {
      if (offering.data.instructor.id !== currentUser.id) {
        throw new ForbiddenException(
          'Access denied: You can only view students for course offerings assigned to you.',
        );
      }
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_offering_id: id },
      include: {
        student: {
          include: {
            program: true,
          },
        },
        grade: true,
      },
      orderBy: { student: { last_name: 'asc' } },
    });

    const students = enrollments.map((e) => ({
      enrollment_id: e.id,
      enrollment_date: e.enrollment_date,
      enrollment_status: e.status,
      student_id: e.student.id,
      student_number: e.student.student_number,
      first_name: e.student.first_name,
      last_name: e.student.last_name,
      email: e.student.email,
      program: e.student.program.code,
      year_level: e.student.year_level,
      student_type: e.student.student_type,
      grade: e.grade,
    }));

    return {
      message: 'Enrolled students retrieved successfully.',
      data: students,
    };
  }
}
