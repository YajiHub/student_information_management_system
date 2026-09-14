import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Academic Reference Data E2E Tests (Programs, Courses, Terms)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash('Password123!', 10);
    // Ensure admin user
    await prisma.user.upsert({
      where: { email: 'admin@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'ADMIN' },
      create: {
        name: 'System Admin',
        email: 'admin@sims.edu',
        password_hash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Ensure student user
    await prisma.user.upsert({
      where: { email: 'student.test@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'STUDENT' },
      create: {
        name: 'Test Student',
        email: 'student.test@sims.edu',
        password_hash: passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    // Login admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@sims.edu', password: 'Password123!' });
    adminToken = adminLogin.body.data.access_token;

    // Login student
    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.test@sims.edu', password: 'Password123!' });
    studentToken = studentLogin.body.data.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Programs', () => {
    let createdProgramId: number;
    const testProgCode = 'PROG-' + Math.floor(Math.random() * 100000);

    it('should create a program as Admin (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: testProgCode,
          name: 'BS Information Technology Test',
          description: 'Testing program creation',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(testProgCode);
      createdProgramId = res.body.data.id;
    });

    it('should reject duplicate program code with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: testProgCode,
          name: 'Another BSIT',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should forbid Student from creating program with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: 'BSCS-TEST',
          name: 'BS Computer Science Test',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should list all programs for authenticated user (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/programs')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Courses', () => {
    let createdCourseId: number;
    const testCourseCode = 'IT-' + Math.floor(Math.random() * 100000);

    it('should create a course as Admin (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course_code: testCourseCode,
          course_title: 'Web Systems 2 Test',
          description: 'Test course',
          units: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.course_code).toBe(testCourseCode);
      createdCourseId = res.body.data.id;
    });

    it('should reject invalid units (e.g. 10) with 422 Unprocessable Content', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course_code: 'IT999-TEST',
          course_title: 'Invalid Units Course',
          units: 10,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.units).toBeDefined();
    });

    it('should retrieve a course by ID (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/courses/${createdCourseId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.course_code).toBe(testCourseCode);
    });
  });

  describe('Academic Terms', () => {
    const testYear = '2088-2089';

    it('should create an academic term as Admin (201)', async () => {
      // Clean up if existing
      await prisma.academicTerm.deleteMany({
        where: { academic_year: testYear },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/academic-terms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academic_year: testYear,
          semester: 'FIRST_SEMESTER',
          start_date: '2088-08-15T00:00:00.000Z',
          end_date: '2088-12-20T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.academic_year).toBe(testYear);
    });

    it('should reject duplicate term for same academic year and semester (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic-terms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academic_year: testYear,
          semester: 'FIRST_SEMESTER',
          start_date: '2088-08-15T00:00:00.000Z',
          end_date: '2088-12-20T00:00:00.000Z',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });
});
