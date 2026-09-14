import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncodeGradeDto } from './dto/encode-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async encode(encodeGradeDto: EncodeGradeDto, currentUser: any) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: encodeGradeDto.enrollment_id },
      include: {
        course_offering: true,
        grade: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${encodeGradeDto.enrollment_id} does not exist.`,
      );
    }

    if (enrollment.grade) {
      throw new ConflictException(
        'A grade record has already been encoded for this enrollment. Please use PUT /grades/:id to update it.',
      );
    }

    // Authorization: If Instructor, verify they are assigned to this course offering
    if (currentUser.role === Role.INSTRUCTOR) {
      if (enrollment.course_offering.instructor_id !== currentUser.id) {
        throw new ForbiddenException(
          'Access denied: You are not authorized to encode grades for a course offering not assigned to you.',
        );
      }
    }

    const remarks =
      encodeGradeDto.remarks ||
      this.computeRemarks(encodeGradeDto.final_grade, encodeGradeDto.midterm_grade);

    const grade = await this.prisma.grade.create({
      data: {
        enrollment_id: encodeGradeDto.enrollment_id,
        midterm_grade: encodeGradeDto.midterm_grade,
        final_grade: encodeGradeDto.final_grade,
        remarks,
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: { id: true, student_number: true, first_name: true, last_name: true },
            },
            course_offering: {
              include: {
                course: true,
                academic_term: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Grade encoded successfully.',
      data: grade,
    };
  }

  async findAll(currentUser: any, enrollmentId?: number, studentId?: number) {
    const where: Prisma.GradeWhereInput = {};

    if (enrollmentId) {
      where.enrollment_id = enrollmentId;
    }

    const enrollmentWhere: Prisma.EnrollmentWhereInput = {};

    if (studentId) {
      enrollmentWhere.student_id = studentId;
    }

    // If Instructor, restrict to grades of their assigned offerings
    if (currentUser && currentUser.role === Role.INSTRUCTOR) {
      enrollmentWhere.course_offering = { instructor_id: currentUser.id };
    }

    if (Object.keys(enrollmentWhere).length > 0) {
      where.enrollment = enrollmentWhere;
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        enrollment: {
          include: {
            student: {
              select: { id: true, student_number: true, first_name: true, last_name: true },
            },
            course_offering: {
              include: {
                course: true,
                academic_term: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      message: 'Grades retrieved successfully.',
      data: grades,
    };
  }

  async findOne(id: number, currentUser: any) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            student: true,
            course_offering: {
              include: {
                course: true,
                academic_term: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade record with ID ${id} not found.`);
    }

    // If Instructor, verify assignment
    if (currentUser.role === Role.INSTRUCTOR) {
      if (grade.enrollment.course_offering.instructor_id !== currentUser.id) {
        throw new ForbiddenException(
          'Access denied: You are not authorized to view grades for offerings not assigned to you.',
        );
      }
    }

    return {
      message: 'Grade details retrieved successfully.',
      data: grade,
    };
  }

  async update(id: number, updateGradeDto: UpdateGradeDto, currentUser: any) {
    const existing = await this.findOne(id, currentUser);

    const finalGrade =
      updateGradeDto.final_grade !== undefined
        ? updateGradeDto.final_grade
        : existing.data.final_grade
          ? Number(existing.data.final_grade)
          : undefined;

    const midtermGrade =
      updateGradeDto.midterm_grade !== undefined
        ? updateGradeDto.midterm_grade
        : existing.data.midterm_grade
          ? Number(existing.data.midterm_grade)
          : undefined;

    const remarks =
      updateGradeDto.remarks || this.computeRemarks(finalGrade, midtermGrade);

    const updated = await this.prisma.grade.update({
      where: { id },
      data: {
        midterm_grade: updateGradeDto.midterm_grade,
        final_grade: updateGradeDto.final_grade,
        remarks,
      },
      include: {
        enrollment: {
          include: {
            student: true,
            course_offering: {
              include: { course: true, academic_term: true },
            },
          },
        },
      },
    });

    return {
      message: 'Grade updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw new NotFoundException(`Grade record with ID ${id} not found.`);
    }

    await this.prisma.grade.delete({ where: { id } });

    return {
      message: 'Grade record deleted successfully.',
      data: null,
    };
  }

  private computeRemarks(finalGrade?: number, midtermGrade?: number): string {
    if (finalGrade !== undefined && finalGrade !== null) {
      if (finalGrade <= 3.0) return 'PASSED';
      if (finalGrade === 5.0) return 'FAILED';
      return 'CONDITIONAL';
    }
    if (midtermGrade !== undefined && midtermGrade !== null) {
      return 'IN PROGRESS';
    }
    return 'NO GRADE';
  }
}
