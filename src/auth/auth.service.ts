import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        student: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Account is inactive. Please contact the administrator.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const { password_hash, ...sanitizedUser } = user;

    return {
      message: 'Authentication successful.',
      data: {
        access_token: accessToken,
        token_type: 'Bearer',
        user: sanitizedUser,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            program: true,
          },
        },
        instructor_offerings: {
          include: {
            course: true,
            academic_term: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const { password_hash, ...sanitizedUser } = user;

    return {
      message: 'Current user profile retrieved successfully.',
      data: sanitizedUser,
    };
  }

  async logout() {
    return {
      message: 'Logout successful. Session invalidated.',
      data: null,
    };
  }
}
