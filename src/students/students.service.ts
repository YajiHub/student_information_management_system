import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { buildPaginationMeta } from '../common/dto/pagination-query.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    // 1. Check duplicate student number
    const existingNum = await this.prisma.student.findUnique({
      where: { student_number: createStudentDto.student_number },
    });
    if (existingNum) {
      throw new ConflictException(
        `A student with student number '${createStudentDto.student_number}' already exists.`,
      );
    }

    // 2. Check duplicate email
    const existingEmail = await this.prisma.student.findUnique({
      where: { email: createStudentDto.email },
    });
    if (existingEmail) {
      throw new ConflictException(
        `A student with email '${createStudentDto.email}' already exists.`,
      );
    }

    // 3. Verify program exists
    const program = await this.prisma.program.findUnique({
      where: { id: createStudentDto.program_id },
    });
    if (!program) {
      throw new BadRequestException(
        `Referenced program with ID ${createStudentDto.program_id} does not exist.`,
      );
    }

    // 4. Verify user_id if provided
    if (createStudentDto.user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: createStudentDto.user_id },
      });
      if (!user) {
        throw new BadRequestException(
          `Referenced user with ID ${createStudentDto.user_id} does not exist.`,
        );
      }
    }

    const student = await this.prisma.student.create({
      data: {
        ...createStudentDto,
        birth_date: new Date(createStudentDto.birth_date),
      },
      include: {
        program: true,
      },
    });

    return {
      message: 'Student created successfully.',
      data: student,
    };
  }

  async findAll(query: QueryStudentsDto) {
    const page = query.page || 1;
    const perPage = query.per_page || 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.StudentWhereInput = {};

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { student_number: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (query.program_id) {
      where.program_id = query.program_id;
    }

    if (query.year_level) {
      where.year_level = query.year_level;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.student_type) {
      where.student_type = query.student_type;
    }

    // Allowed sort columns
    const allowedSortFields = [
      'student_number',
      'last_name',
      'first_name',
      'year_level',
      'created_at',
    ];
    const incomingSort = query.sort || query.sort_by;
    const sortField = allowedSortFields.includes(incomingSort || '')
      ? incomingSort!
      : 'student_number';
    const incomingOrder = query.order || query.sort_order || 'asc';
    const sortOrder = incomingOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const [totalRecords, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortField]: sortOrder },
        include: {
          program: true,
        },
      }),
    ]);

    return {
      message: 'Students retrieved successfully.',
      data: students,
      meta: buildPaginationMeta(totalRecords, page, perPage),
    };
  }

  async findOne(id: number, currentUser?: any) {
    this.assertOwnershipOrPrivilegedRole(id, currentUser);

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        program: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found.`);
    }

    return {
      message: 'Student retrieved successfully.',
      data: student,
    };
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Student with ID ${id} not found.`);
    }

    if (updateStudentDto.student_number) {
      const duplicate = await this.prisma.student.findUnique({
        where: { student_number: updateStudentDto.student_number },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `A student with student number '${updateStudentDto.student_number}' already exists.`,
        );
      }
    }

    if (updateStudentDto.email) {
      const duplicate = await this.prisma.student.findUnique({
        where: { email: updateStudentDto.email },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `A student with email '${updateStudentDto.email}' already exists.`,
        );
      }
    }

    if (updateStudentDto.program_id) {
      const program = await this.prisma.program.findUnique({
        where: { id: updateStudentDto.program_id },
      });
      if (!program) {
        throw new BadRequestException(
          `Referenced program with ID ${updateStudentDto.program_id} does not exist.`,
        );
      }
    }

    const updateData: any = { ...updateStudentDto };
    if (updateStudentDto.birth_date) {
      updateData.birth_date = new Date(updateStudentDto.birth_date);
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        program: true,
      },
    });

    return {
      message: 'Student updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Student with ID ${id} not found.`);
    }

    const enrollmentCount = await this.prisma.enrollment.count({
      where: { student_id: id },
    });

    if (enrollmentCount > 0) {
      throw new ConflictException(
        `Cannot delete student because they have ${enrollmentCount} active or historical enrollment(s). Consider setting status to INACTIVE or DROPPED.`,
      );
    }

    await this.prisma.student.delete({
      where: { id },
    });

    return {
      message: 'Student deleted successfully.',
      data: null,
    };
  }

  async getEnrollments(studentId: number, currentUser?: any) {
    this.assertOwnershipOrPrivilegedRole(studentId, currentUser);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { student_id: studentId },
      include: {
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
      message: 'Student enrollments retrieved successfully.',
      data: enrollments,
    };
  }

  async getGrades(studentId: number, currentUser?: any) {
    this.assertOwnershipOrPrivilegedRole(studentId, currentUser);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        student_id: studentId,
        grade: { isNot: null },
      },
      include: {
        course_offering: {
          include: {
            course: true,
            academic_term: true,
          },
        },
        grade: true,
      },
      orderBy: { enrollment_date: 'desc' },
    });

    const grades = enrollments.map((e) => ({
      enrollment_id: e.id,
      course_code: e.course_offering.course.course_code,
      course_title: e.course_offering.course.course_title,
      units: e.course_offering.course.units,
      academic_year: e.course_offering.academic_term.academic_year,
      semester: e.course_offering.academic_term.semester,
      midterm_grade: e.grade?.midterm_grade,
      final_grade: e.grade?.final_grade,
      remarks: e.grade?.remarks,
    }));

    return {
      message: 'Student grades retrieved successfully.',
      data: grades,
    };
  }

  async getAcademicRecord(studentId: number, currentUser?: any) {
    this.assertOwnershipOrPrivilegedRole(studentId, currentUser);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        enrollments: {
          include: {
            course_offering: {
              include: {
                course: true,
                academic_term: true,
              },
            },
            grade: true,
          },
          orderBy: { enrollment_date: 'asc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found.`);
    }

    // Group enrollments by academic term
    const termMap = new Map<number, { term: any; courses: any[] }>();

    for (const enrollment of student.enrollments) {
      const term = enrollment.course_offering.academic_term;
      if (!termMap.has(term.id)) {
        termMap.set(term.id, {
          term: {
            id: term.id,
            academic_year: term.academic_year,
            semester: term.semester,
          },
          courses: [],
        });
      }

      termMap.get(term.id)!.courses.push({
        enrollment_id: enrollment.id,
        course_code: enrollment.course_offering.course.course_code,
        course_title: enrollment.course_offering.course.course_title,
        units: enrollment.course_offering.course.units,
        section: enrollment.course_offering.section,
        status: enrollment.status,
        midterm_grade: enrollment.grade?.midterm_grade ?? null,
        final_grade: enrollment.grade?.final_grade ?? null,
        remarks: enrollment.grade?.remarks ?? 'IN PROGRESS',
      });
    }

    let cumulativeQualityPoints = 0;
    let cumulativeUnits = 0;

    const termsReport = Array.from(termMap.values()).map((termGroup) => {
      let termQualityPoints = 0;
      let termUnits = 0;

      for (const c of termGroup.courses) {
        if (c.final_grade !== null) {
          const numGrade = Number(c.final_grade);
          termQualityPoints += numGrade * c.units;
          termUnits += c.units;
        }
      }

      const termGWA = termUnits > 0 ? Number((termQualityPoints / termUnits).toFixed(2)) : null;

      if (termUnits > 0) {
        cumulativeQualityPoints += termQualityPoints;
        cumulativeUnits += termUnits;
      }

      return {
        academic_term: termGroup.term,
        total_units: termGroup.courses.reduce((sum, c) => sum + c.units, 0),
        term_gwa: termGWA,
        courses: termGroup.courses,
      };
    });

    const cumulativeGPA =
      cumulativeUnits > 0
        ? Number((cumulativeQualityPoints / cumulativeUnits).toFixed(2))
        : null;

    return {
      message: 'Student academic record retrieved successfully.',
      data: {
        student: {
          id: student.id,
          student_number: student.student_number,
          full_name: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}${student.suffix ? ' ' + student.suffix : ''}`,
          program: student.program.name,
          program_code: student.program.code,
          year_level: student.year_level,
          student_type: student.student_type,
          status: student.status,
        },
        summary: {
          total_enrolled_courses: student.enrollments.length,
          total_credited_units: cumulativeUnits,
          cumulative_gpa: cumulativeGPA,
        },
        terms: termsReport,
      },
    };
  }

  private assertOwnershipOrPrivilegedRole(studentId: number, currentUser?: any) {
    if (!currentUser) {
      return;
    }

    // Admin, Registrar, Instructor can inspect student details
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.REGISTRAR ||
      currentUser.role === Role.INSTRUCTOR
    ) {
      return;
    }

    // Student role must match their own student record ID
    if (currentUser.role === Role.STUDENT) {
      if (!currentUser.student || currentUser.student.id !== studentId) {
        throw new ForbiddenException(
          'Access denied: You are not authorized to access another student academic record.',
        );
      }
    }
  }
}
