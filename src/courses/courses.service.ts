import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { buildPaginationMeta } from '../common/dto/pagination-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { course_code: createCourseDto.course_code },
    });

    if (existing) {
      throw new ConflictException(
        `A course with code '${createCourseDto.course_code}' already exists.`,
      );
    }

    const course = await this.prisma.course.create({
      data: createCourseDto,
    });

    return {
      message: 'Course created successfully.',
      data: course,
    };
  }

  async findAll(query: QueryCoursesDto = new QueryCoursesDto()) {
    const page = query.page || 1;
    const perPage = query.per_page || 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.CourseWhereInput = {};

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { course_code: { contains: search, mode: 'insensitive' } },
        { course_title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalRecords, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { course_code: 'asc' },
      }),
    ]);

    return {
      message: 'Courses retrieved successfully.',
      data: courses,
      meta: buildPaginationMeta(totalRecords, page, perPage),
    };
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { offerings: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found.`);
    }

    return {
      message: 'Course retrieved successfully.',
      data: course,
    };
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    await this.findOne(id);

    if (updateCourseDto.course_code) {
      const existing = await this.prisma.course.findUnique({
        where: { course_code: updateCourseDto.course_code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A course with code '${updateCourseDto.course_code}' already exists.`,
        );
      }
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });

    return {
      message: 'Course updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const offeringCount = await this.prisma.courseOffering.count({
      where: { course_id: id },
    });

    if (offeringCount > 0) {
      throw new ConflictException(
        `Cannot delete course because it has ${offeringCount} active offering(s).`,
      );
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return {
      message: 'Course deleted successfully.',
      data: null,
    };
  }
}
