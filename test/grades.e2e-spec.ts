import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Grades & Academic Record E2E Tests (Activity 2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let assignedInstructorToken: string;
  let otherInstructorToken: string;
  let studentToken: string;

  let enrollmentId: number;
  let studentId: number;
  let gradeId: number;

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

    // 1. Assigned Instructor
    const inst1 = await prisma.user.upsert({
      where: { email: 'prof.assigned@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'INSTRUCTOR' },
      create: {
        name: 'Prof. Assigned',
        email: 'prof.assigned@sims.edu',
        password_hash: passwordHash,
        role: 'INSTRUCTOR',
      },
    });

    // 2. Unassigned Instructor
    await prisma.user.upsert({
      where: { email: 'prof.other@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'INSTRUCTOR' },
      create: {
        name: 'Prof. Other',
        email: 'prof.other@sims.edu',
        password_hash: passwordHash,
        role: 'INSTRUCTOR',
      },
    });

    // 3. Student User & Profile
    const studentUser = await prisma.user.upsert({
      where: { email: 'student.graded@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'STUDENT' },
      create: {
        name: 'Graded Student',
        email: 'student.graded@sims.edu',
        password_hash: passwordHash,
        role: 'STUDENT',
      },
    });

    const prog = await prisma.program.upsert({
      where: { code: 'BSCS' },
      update: {},
      create: { code: 'BSCS', name: 'BS Computer Science' },
    });

    const student = await prisma.student.upsert({
      where: { student_number: '2026-00050' },
      update: { user_id: studentUser.id },
      create: {
        student_number: '2026-00050',
        first_name: 'Clara',
        last_name: 'Buenaventura',
        birth_date: new Date('2003-03-15'),
        email: 'clara.buenaventura@sims.edu',
        program_id: prog.id,
        user_id: studentUser.id,
      },
    });
    studentId = student.id;

    // Course & Term
    const course = await prisma.course.upsert({
      where: { course_code: 'CS201' },
      update: {},
      create: { course_code: 'CS201', course_title: 'Data Structures', units: 3 },
    });

    const term = await prisma.academicTerm.upsert({
      where: {
        academic_year_semester: {
          academic_year: '2026-2027',
          semester: 'SECOND_SEMESTER',
        },
      },
      update: {},
      create: {
        academic_year: '2026-2027',
        semester: 'SECOND_SEMESTER',
        start_date: new Date('2027-01-10'),
        end_date: new Date('2027-05-30'),
      },
    });

    // Offering assigned to inst1
    const offering = await prisma.courseOffering.create({
      data: {
        course_id: course.id,
        academic_term_id: term.id,
        instructor_id: inst1.id,
        section: 'CS-2A',
        schedule: 'TTH 09:00 - 10:30',
        room: 'Lab 1',
        capacity: 30,
      },
    });

    // Enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        student_id: student.id,
        course_offering_id: offering.id,
      },
    });
    enrollmentId = enrollment.id;

    // Login tokens
    const inst1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof.assigned@sims.edu', password: 'Password123!' });
    assignedInstructorToken = inst1Res.body.data.access_token;

    const inst2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'prof.other@sims.edu', password: 'Password123!' });
    otherInstructorToken = inst2Res.body.data.access_token;

    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.graded@sims.edu', password: 'Password123!' });
    studentToken = studentRes.body.data.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should prevent unassigned instructor from encoding grade (403 Forbidden)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/grades')
      .set('Authorization', `Bearer ${otherInstructorToken}`)
      .send({
        enrollment_id: enrollmentId,
        midterm_grade: 1.5,
        final_grade: 1.75,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  it('should encode grade by assigned instructor (201 Created)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/grades')
      .set('Authorization', `Bearer ${assignedInstructorToken}`)
      .send({
        enrollment_id: enrollmentId,
        midterm_grade: 1.75,
        final_grade: 1.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.final_grade)).toBe(1.5);
    expect(res.body.data.remarks).toBe('PASSED');
    gradeId = res.body.data.id;
  });

  it('should update grade by assigned instructor (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/v1/grades/${gradeId}`)
      .set('Authorization', `Bearer ${assignedInstructorToken}`)
      .send({
        final_grade: 1.25,
        remarks: 'EXCELLENT',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.final_grade)).toBe(1.25);
    expect(res.body.data.remarks).toBe('EXCELLENT');
  });

  it('should retrieve student grades from /students/:id/grades (200)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/students/${studentId}/grades`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].course_code).toBe('CS201');
  });

  it('should retrieve aggregated academic record grouped by term (200)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/students/${studentId}/academic-record`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.student_number).toBe('2026-00050');
    expect(res.body.data.summary.cumulative_gpa).toBe(1.25);
    expect(res.body.data.terms.length).toBeGreaterThan(0);
    expect(res.body.data.terms[0].term_gwa).toBe(1.25);
  });
});
