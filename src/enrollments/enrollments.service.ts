import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    // 1. Check student exists
    const student = await this.prisma.student.findUnique({
      where: { id: createEnrollmentDto.student_id },
    });
    if (!student) {
      throw new BadRequestException(
        `Student with ID ${createEnrollmentDto.student_id} does not exist.`,
      );
    }
    if (student.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot enroll student: Student status is '${student.status}'.`,
      );
    }

    // 2. Check offering exists
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: createEnrollmentDto.course_offering_id },
      include: {
        course: true,
        academic_term: true,
      },
    });
    if (!offering) {
      throw new BadRequestException(
        `Course offering with ID ${createEnrollmentDto.course_offering_id} does not exist.`,
      );
    }
    if (offering.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot enroll student: Course offering status is '${offering.status}'.`,
      );
    }

    // 3. Duplicate enrollment prevention (Lab Section 7.2)
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_offering_id: {
          student_id: createEnrollmentDto.student_id,
          course_offering_id: createEnrollmentDto.course_offering_id,
        },
      },
    });
    if (existingEnrollment) {
      throw new ConflictException(
        'Duplicate enrollment: Student is already enrolled in this course offering.',
      );
    }

    // 4. Section capacity check
    const currentEnrolledCount = await this.prisma.enrollment.count({
      where: {
        course_offering_id: createEnrollmentDto.course_offering_id,
        status: 'ENROLLED',
      },
    });
    if (currentEnrolledCount >= offering.capacity) {
      throw new BadRequestException(
        `Course offering section '${offering.section}' has reached maximum student capacity (${offering.capacity}).`,
      );
    }

    // 5. Academic term max allowed unit load check (supports irregular students)
    const termEnrollments = await this.prisma.enrollment.findMany({
      where: {
        student_id: student.id,
        status: 'ENROLLED',
        course_offering: {
          academic_term_id: offering.academic_term_id,
        },
      },
      include: {
        course_offering: {
          include: {
            course: true,
          },
        },
      },
    });

    const currentUnits = termEnrollments.reduce(
      (sum, e) => sum + e.course_offering.course.units,
      0,
    );
    const newUnits = offering.course.units;

    if (currentUnits + newUnits > student.max_allowed_units) {
      throw new BadRequestException(
        `Enrollment exceeds maximum allowed units (${student.max_allowed_units} units) for ${student.student_type} student in this academic term. Current: ${currentUnits} units, requested course: ${newUnits} units.`,
      );
    }

    // 6. Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        student_id: createEnrollmentDto.student_id,
        course_offering_id: createEnrollmentDto.course_offering_id,
        enrollment_date: createEnrollmentDto.enrollment_date
          ? new Date(createEnrollmentDto.enrollment_date)
          : new Date(),
        status: createEnrollmentDto.status || 'ENROLLED',
      },
      include: {
        student: {
          select: {
            id: true,
            student_number: true,
            first_name: true,
            last_name: true,
            student_type: true,
          },
        },
        course_offering: {
          include: {
            course: true,
            academic_term: true,
          },
        },
      },
    });

    return {
      message: 'Student enrolled successfully.',
      data: enrollment,
    };
  }

  async findAll(studentId?: number, offeringId?: number, status?: string) {
    const where: any = {};
    if (studentId) where.student_id = studentId;
    if (offeringId) where.course_offering_id = offeringId;
    if (status) where.status = status;

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            student_number: true,
            first_name: true,
            last_name: true,
          },
        },
        course_offering: {
          include: {
            course: true,
            academic_term: true,
            instructor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        grade: true,
      },
      orderBy: { enrollment_date: 'desc' },
    });

    return {
      message: 'Enrollments retrieved successfully.',
      data: enrollments,
    };
  }

  async findOne(id: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: { program: true },
        },
        course_offering: {
          include: {
            course: true,
            academic_term: true,
            instructor: { select: { id: true, name: true, email: true } },
          },
        },
        grade: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found.`);
    }

    return {
      message: 'Enrollment record retrieved successfully.',
      data: enrollment,
    };
  }

  async update(id: number, updateEnrollmentDto: UpdateEnrollmentDto) {
    await this.findOne(id);

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: updateEnrollmentDto,
      include: {
        student: true,
        course_offering: {
          include: { course: true, academic_term: true },
        },
      },
    });

    return {
      message: 'Enrollment status updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    const enrollment = await this.findOne(id);

    if (enrollment.data.grade) {
      throw new ConflictException(
        'Cannot delete enrollment because an academic grade record has already been encoded.',
      );
    }

    await this.prisma.enrollment.delete({
      where: { id },
    });

    return {
      message: 'Enrollment cancelled successfully.',
      data: null,
    };
  }
}
