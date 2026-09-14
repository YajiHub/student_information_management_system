import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicTermDto } from './dto/create-term.dto';
import { UpdateAcademicTermDto } from './dto/update-term.dto';

@Injectable()
export class AcademicTermsService {
  constructor(private prisma: PrismaService) {}

  async create(createTermDto: CreateAcademicTermDto) {
    const existing = await this.prisma.academicTerm.findUnique({
      where: {
        academic_year_semester: {
          academic_year: createTermDto.academic_year,
          semester: createTermDto.semester,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Academic term ${createTermDto.academic_year} (${createTermDto.semester}) already exists.`,
      );
    }

    const term = await this.prisma.academicTerm.create({
      data: {
        ...createTermDto,
        start_date: new Date(createTermDto.start_date),
        end_date: new Date(createTermDto.end_date),
      },
    });

    return {
      message: 'Academic term created successfully.',
      data: term,
    };
  }

  async findAll() {
    const terms = await this.prisma.academicTerm.findMany({
      orderBy: [{ academic_year: 'desc' }, { semester: 'asc' }],
    });

    return {
      message: 'Academic terms retrieved successfully.',
      data: terms,
    };
  }

  async findOne(id: number) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id },
      include: {
        _count: {
          select: { offerings: true },
        },
      },
    });

    if (!term) {
      throw new NotFoundException(`Academic term with ID ${id} not found.`);
    }

    return {
      message: 'Academic term retrieved successfully.',
      data: term,
    };
  }

  async update(id: number, updateTermDto: UpdateAcademicTermDto) {
    await this.findOne(id);

    const updateData: any = { ...updateTermDto };
    if (updateTermDto.start_date) {
      updateData.start_date = new Date(updateTermDto.start_date);
    }
    if (updateTermDto.end_date) {
      updateData.end_date = new Date(updateTermDto.end_date);
    }

    if (updateTermDto.academic_year && updateTermDto.semester) {
      const existing = await this.prisma.academicTerm.findUnique({
        where: {
          academic_year_semester: {
            academic_year: updateTermDto.academic_year,
            semester: updateTermDto.semester,
          },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Academic term ${updateTermDto.academic_year} (${updateTermDto.semester}) already exists.`,
        );
      }
    }

    const updated = await this.prisma.academicTerm.update({
      where: { id },
      data: updateData,
    });

    return {
      message: 'Academic term updated successfully.',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const offeringCount = await this.prisma.courseOffering.count({
      where: { academic_term_id: id },
    });

    if (offeringCount > 0) {
      throw new ConflictException(
        `Cannot delete academic term because it has ${offeringCount} active course offering(s).`,
      );
    }

    await this.prisma.academicTerm.delete({
      where: { id },
    });

    return {
      message: 'Academic term deleted successfully.',
      data: null,
    };
  }
}
