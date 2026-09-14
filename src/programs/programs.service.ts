import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async create(createProgramDto: CreateProgramDto) {
    const existing = await this.prisma.program.findUnique({
      where: { code: createProgramDto.code },
    });

    if (existing) {
      throw new ConflictException(
        `A program with code '${createProgramDto.code}' already exists.`,
      );
    }

    const program = await this.prisma.program.create({
      data: createProgramDto,
    });

    return {
      message: 'Program created successfully.',
      data: program,
    };
  }

  async findAll() {
    const programs = await this.prisma.program.findMany({
      orderBy: { code: 'asc' },
    });

    return {
      message: 'Programs retrieved successfully.',
      data: programs,
    };
  }

  async findOne(id: number) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found.`);
    }

    return {
      message: 'Program retrieved successfully.',
      data: program,
    };
  }

  async update(id: number, updateProgramDto: UpdateProgramDto) {
    await this.findOne(id);

    if (updateProgramDto.code) {
      const existing = await this.prisma.program.findUnique({
        where: { code: updateProgramDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A program with code '${updateProgramDto.code}' already exists.`,
        );
      }
    }

    const updated = await this.prisma.program.update({
      where: { id },
      data: updateProgramDto,
    });

    return {
      message: 'Program updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const studentCount = await this.prisma.student.count({
      where: { program_id: id },
    });

    if (studentCount > 0) {
      throw new ConflictException(
        `Cannot delete program because it has ${studentCount} associated student(s).`,
      );
    }

    await this.prisma.program.delete({
      where: { id },
    });

    return {
      message: 'Program deleted successfully.',
      data: null,
    };
  }
}
