import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Students Module E2E Tests (Activity 2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let student1Token: string;
  let student2Token: string;

  let programId: number;
  let student1Id: number;
  let student2Id: number;

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

    // Setup Program
    const prog = await prisma.program.upsert({
      where: { code: 'BSIT' },
      update: {},
      create: {
        code: 'BSIT',
        name: 'Bachelor of Science in Information Technology',
      },
    });
    programId = prog.id;

    // Password hash for test accounts
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Admin user
    await prisma.user.upsert({
      where: { email: 'admin@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'ADMIN' },
      create: {
        name: 'System Admin',
        email: 'admin@sims.edu',
        password_hash: passwordHash,
        role: 'ADMIN',
      },
    });

    // Student 1 User
    const user1 = await prisma.user.upsert({
      where: { email: 'student1@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'STUDENT' },
      create: {
        name: 'Student One',
        email: 'student1@sims.edu',
        password_hash: passwordHash,
        role: 'STUDENT',
      },
    });

    // Student 2 User
    const user2 = await prisma.user.upsert({
      where: { email: 'student2@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'STUDENT' },
      create: {
        name: 'Student Two',
        email: 'student2@sims.edu',
        password_hash: passwordHash,
        role: 'STUDENT',
      },
    });

    // Student 1 Profile
    const s1 = await prisma.student.upsert({
      where: { student_number: '2026-00001' },
      update: { user_id: user1.id },
      create: {
        student_number: '2026-00001',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        birth_date: new Date('2003-01-01'),
        email: 'juan.delacruz@sims.edu',
        program_id: programId,
        user_id: user1.id,
        year_level: 4,
        student_type: 'REGULAR',
      },
    });
    student1Id = s1.id;

    // Student 2 Profile
    const s2 = await prisma.student.upsert({
      where: { student_number: '2026-00002' },
      update: { user_id: user2.id },
      create: {
        student_number: '2026-00002',
        first_name: 'Maria',
        last_name: 'Santos',
        birth_date: new Date('2004-02-02'),
        email: 'maria.santos@sims.edu',
        program_id: programId,
        user_id: user2.id,
        year_level: 3,
        student_type: 'IRREGULAR',
      },
    });
    student2Id = s2.id;

    // Get tokens
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@sims.edu', password: 'Password123!' });
    adminToken = adminRes.body.data.access_token;

    const s1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student1@sims.edu', password: 'Password123!' });
    student1Token = s1Res.body.data.access_token;

    const s2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student2@sims.edu', password: 'Password123!' });
    student2Token = s2Res.body.data.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create a valid student with 201 Created (Admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_number: '2026-00099',
        first_name: 'Pedro',
        last_name: 'Penduko',
        birth_date: '2004-05-15T00:00:00.000Z',
        email: 'pedro.penduko@sims.edu',
        program_id: programId,
        year_level: 2,
        student_type: 'IRREGULAR',
        max_allowed_units: 18,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student_number).toBe('2026-00099');
    expect(res.body.data.student_type).toBe('IRREGULAR');
    expect(res.body.data.max_allowed_units).toBe(18);
  });

  it('should reject duplicate student number with 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_number: '2026-00001',
        first_name: 'Duplicate',
        last_name: 'Student',
        birth_date: '2004-05-15T00:00:00.000Z',
        email: 'unique.email@sims.edu',
        program_id: programId,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid student number pattern with 422 Unprocessable Content', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_number: 'BAD-FORMAT',
        first_name: 'Invalid',
        last_name: 'Format',
        birth_date: '2004-05-15T00:00:00.000Z',
        email: 'valid.email@sims.edu',
        program_id: programId,
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.student_number).toBeDefined();
  });

  it('should reject invalid email with 422 Unprocessable Content', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_number: '2026-00088',
        first_name: 'Bad',
        last_name: 'Email',
        birth_date: '2004-05-15T00:00:00.000Z',
        email: 'not-an-email',
        program_id: programId,
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.email).toBeDefined();
  });

  it('should search and filter student records (search, student_type, pagination)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/students?search=santos&student_type=IRREGULAR&page=1&per_page=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].last_name).toBe('Santos');
    expect(res.body.meta).toEqual({
      page: 1,
      per_page: 10,
      total_records: expect.any(Number),
      total_pages: expect.any(Number),
      has_next: expect.any(Boolean),
      has_prev: false,
    });
  });

  it('should allow student to view their own profile (200)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/students/${student1Id}`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(student1Id);
    expect(res.body.data.student_number).toBe('2026-00001');
  });

  it('should forbid student from accessing another student record (403 Object-Level Authorization)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/students/${student2Id}`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });
});
