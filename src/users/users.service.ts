import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { buildPaginationMeta } from '../common/dto/pagination-query.dto';

const BCRYPT_ROUNDS = 10;

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  created_at: true,
  updated_at: true,
  student: {
    select: { id: true, student_number: true, first_name: true, last_name: true },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const page = query.page || 1;
    const perPage = query.per_page || 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalRecords, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { name: 'asc' },
        select: SAFE_USER_SELECT,
      }),
    ]);

    return {
      message: 'Users retrieved successfully.',
      data: users,
      meta: buildPaginationMeta(totalRecords, page, perPage),
    };
  }

  /** Active instructor accounts available for course offering assignment. */
  async findInstructors() {
    const instructors = await this.prisma.user.findMany({
      where: { role: Role.INSTRUCTOR, status: UserStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    });

    return {
      message: 'Instructors retrieved successfully.',
      data: instructors,
    };
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException(`A user with email '${createUserDto.email}' already exists.`);
    }

    const password_hash = await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS);
    const student = await this.resolveStudentLink(createUserDto.student_id);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        role: createUserDto.role,
        status: createUserDto.status ?? UserStatus.ACTIVE,
        password_hash,
        ...(student ? { student: { connect: { id: student.id } } } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    return {
      message: 'User account created successfully.',
      data: user,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: any) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Guard rails: an admin cannot lock themselves out.
    if (currentUser?.id === id) {
      if (updateUserDto.status && updateUserDto.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Access denied: You cannot deactivate your own account.');
      }
      if (updateUserDto.role && updateUserDto.role !== existing.role) {
        throw new ForbiddenException('Access denied: You cannot change your own role.');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== existing.email) {
      const duplicate = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`A user with email '${updateUserDto.email}' already exists.`);
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (updateUserDto.name !== undefined) data.name = updateUserDto.name;
    if (updateUserDto.email !== undefined) data.email = updateUserDto.email;
    if (updateUserDto.role !== undefined) data.role = updateUserDto.role;
    if (updateUserDto.status !== undefined) data.status = updateUserDto.status;
    if (updateUserDto.password) {
      data.password_hash = await bcrypt.hash(updateUserDto.password, BCRYPT_ROUNDS);
    }

    if (updateUserDto.student_id !== undefined) {
      const student = await this.resolveStudentLink(updateUserDto.student_id, id);
      data.student = student ? { connect: { id: student.id } } : { disconnect: true };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_USER_SELECT,
    });

    return {
      message: 'User account updated successfully.',
      data: user,
    };
  }

  async remove(id: number, currentUser?: any) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { instructor_offerings: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (currentUser?.id === id) {
      throw new ForbiddenException('Access denied: You cannot delete your own account.');
    }

    if (existing._count.instructor_offerings > 0) {
      throw new ConflictException(
        `Cannot delete user because they are assigned to ${existing._count.instructor_offerings} course offering(s). Deactivate the account instead.`,
      );
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      message: 'User account deleted successfully.',
      data: null,
    };
  }

  private async resolveStudentLink(studentId?: number, currentUserId?: number) {
    if (!studentId) {
      return null;
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${studentId} does not exist.`);
    }

    if (student.user && student.user.id !== currentUserId) {
      throw new ConflictException(
        `Student ${student.student_number} is already linked to user account '${student.user.email}'.`,
      );
    }

    return student;
  }
}
