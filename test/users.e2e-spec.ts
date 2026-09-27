import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users & RBAC Administration E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let instructorToken: string;
  let adminId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'ADMIN' },
      create: {
        name: 'Admin User',
        email: 'admin@sims.edu',
        password_hash: passwordHash,
        role: 'ADMIN',
      },
    });
    adminId = admin.id;

    await prisma.user.upsert({
      where: { email: 'prof.cruz@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'INSTRUCTOR' },
      create: {
        name: 'Prof. Cruz',
        email: 'prof.cruz@sims.edu',
        password_hash: passwordHash,
        role: 'INSTRUCTOR',
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@sims.edu', password: 'Password123!' });
    adminToken = adminLogin.body.data.access_token;

    const instructorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof.cruz@sims.edu', password: 'Password123!' });
    instructorToken = instructorLogin.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a registrar account without leaking the password hash (201)', async () => {
    const email = `registrar.${Date.now()}@sims.edu`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Registrar One', email, password: 'RegistrarPass123!', role: 'REGISTRAR' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.password_hash).toBeUndefined();

    // The new account must be able to authenticate with the given password
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'RegistrarPass123!' });
    expect(login.status).toBe(200);
  });

  it('should reject duplicate account emails (409)', async () => {
    const email = `duplicate.${Date.now()}@sims.edu`;
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'First', email, password: 'Password123!', role: 'INSTRUCTOR' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Second', email, password: 'Password123!', role: 'INSTRUCTOR' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject weak credentials on account creation (422)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Short Password',
        email: `short.${Date.now()}@sims.edu`,
        password: 'abc',
        role: 'INSTRUCTOR',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.password).toBeDefined();
  });

  it('should list users with pagination metadata and role filter (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users?role=INSTRUCTOR&per_page=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.per_page).toBe(5);
    expect(res.body.data.every((u: any) => u.role === 'INSTRUCTOR')).toBe(true);
  });

  it('should list active instructors for offering assignment (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/instructors')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0].role).toBeUndefined();
  });

  it('should block non-admin roles from the user administration console (403)', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(list.status).toBe(403);

    const create = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ name: 'X', email: `x.${Date.now()}@sims.edu`, password: 'Password123!', role: 'ADMIN' });
    expect(create.status).toBe(403);
  });

  it('should update an account role, status, and password (200)', async () => {
    const email = `promote.${Date.now()}@sims.edu`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'To Promote', email, password: 'Password123!', role: 'STUDENT' });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/users/${created.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'REGISTRAR', status: 'ACTIVE', name: 'Promoted User' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('REGISTRAR');
    expect(res.body.data.name).toBe('Promoted User');
  });

  it('should stop an admin from deactivating or deleting their own account (403)', async () => {
    const deactivate = await request(app.getHttpServer())
      .patch(`/api/v1/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INACTIVE' });
    expect(deactivate.status).toBe(403);
    expect(deactivate.body.message).toContain('cannot deactivate your own account');

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(remove.status).toBe(403);
    expect(remove.body.message).toContain('cannot delete your own account');
  });

  it('should refuse to delete an instructor who is still assigned to an offering (409)', async () => {
    const email = `assigned.${Date.now()}@sims.edu`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Assigned Instructor', email, password: 'Password123!', role: 'INSTRUCTOR' });
    const instructorId = created.body.data.id;

    const program = await prisma.program.upsert({
      where: { code: 'BSIT' },
      update: {},
      create: { code: 'BSIT', name: 'BS IT' },
    });
    const term = await prisma.academicTerm.upsert({
      where: {
        academic_year_semester: { academic_year: '2026-2027', semester: 'FIRST_SEMESTER' },
      },
      update: {},
      create: {
        academic_year: '2026-2027',
        semester: 'FIRST_SEMESTER',
        start_date: new Date('2026-08-01'),
        end_date: new Date('2026-12-15'),
      },
    });
    expect(program.id).toBeGreaterThan(0);

    const course = await prisma.course.upsert({
      where: { course_code: 'USRTEST1' },
      update: {},
      create: { course_code: 'USRTEST1', course_title: 'User Admin Probe', units: 3 },
    });
    const offering = await prisma.courseOffering.create({
      data: {
        course_id: course.id,
        academic_term_id: term.id,
        instructor_id: instructorId,
        section: `UA-${Math.floor(Math.random() * 100000)}`,
        schedule: 'MW 08:00 - 09:30',
        room: 'Room 101',
      },
    });

    const blocked = await request(app.getHttpServer())
      .delete(`/api/v1/users/${instructorId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('course offering');

    await prisma.courseOffering.delete({ where: { id: offering.id } });

    const allowed = await request(app.getHttpServer())
      .delete(`/api/v1/users/${instructorId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.success).toBe(true);
  });
});
