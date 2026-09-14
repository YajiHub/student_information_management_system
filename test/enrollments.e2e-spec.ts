import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Enrollments & Offerings E2E Tests (Activity 2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  let courseId: number;
  let bigCourseId: number;
  let termId: number;
  let instructorId: number;
  let offeringId: number;
  let tinyOfferingId: number;

  let regularStudentId: number;
  let lowUnitStudentId: number;

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

    // Setup Admin
    await prisma.user.upsert({
      where: { email: 'admin@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'ADMIN' },
      create: {
        name: 'Admin User',
        email: 'admin@sims.edu',
        password_hash: passwordHash,
        role: 'ADMIN',
      },
    });

    // Setup Instructor
    const instructor = await prisma.user.upsert({
      where: { email: 'prof.cruz@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'INSTRUCTOR' },
      create: {
        name: 'Prof. Cruz',
        email: 'prof.cruz@sims.edu',
        password_hash: passwordHash,
        role: 'INSTRUCTOR',
      },
    });
    instructorId = instructor.id;

    // Setup Program
    const program = await prisma.program.upsert({
      where: { code: 'BSIT' },
      update: {},
      create: { code: 'BSIT', name: 'BS IT' },
    });

    // Setup Courses (one standard 3 units, one heavy 6 units)
    const c1 = await prisma.course.upsert({
      where: { course_code: 'CS101' },
      update: {},
      create: { course_code: 'CS101', course_title: 'Intro to CS', units: 3 },
    });
    courseId = c1.id;

    const c2 = await prisma.course.upsert({
      where: { course_code: 'HEAVY300' },
      update: {},
      create: { course_code: 'HEAVY300', course_title: 'Heavy Project Course', units: 6 },
    });
    bigCourseId = c2.id;

    // Setup Term
    const term = await prisma.academicTerm.upsert({
      where: {
        academic_year_semester: {
          academic_year: '2026-2027',
          semester: 'FIRST_SEMESTER',
        },
      },
      update: {},
      create: {
        academic_year: '2026-2027',
        semester: 'FIRST_SEMESTER',
        start_date: new Date('2026-08-01'),
        end_date: new Date('2026-12-15'),
      },
    });
    termId = term.id;

    // Setup Student 1 (regular, 24 units cap)
    const s1 = await prisma.student.upsert({
      where: { student_number: '2026-00010' },
      update: {},
      create: {
        student_number: '2026-00010',
        first_name: 'Jose',
        last_name: 'Rizal',
        birth_date: new Date('2002-06-19'),
        email: 'jose.rizal@sims.edu',
        program_id: program.id,
        student_type: 'REGULAR',
        max_allowed_units: 24,
      },
    });
    regularStudentId = s1.id;

    // Setup Student 2 (irregular underload on probation, only 3 units allowed cap)
    const s2 = await prisma.student.upsert({
      where: { student_number: '2026-00011' },
      update: {},
      create: {
        student_number: '2026-00011',
        first_name: 'Andres',
        last_name: 'Bonifacio',
        birth_date: new Date('2003-11-30'),
        email: 'andres.bonifacio@sims.edu',
        program_id: program.id,
        student_type: 'IRREGULAR',
        max_allowed_units: 3,
      },
    });
    lowUnitStudentId = s2.id;

    // Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@sims.edu', password: 'Password123!' });
    adminToken = loginRes.body.data.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create a course offering with section capacity (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/course-offerings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        course_id: courseId,
        academic_term_id: termId,
        instructor_id: instructorId,
        section: 'BSIT-1A',
        schedule: 'TH 10:00 - 11:30',
        room: 'Room 304',
        capacity: 35,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.section).toBe('BSIT-1A');
    offeringId = res.body.data.id;
  });

  it('should create a tiny capacity offering (capacity: 1)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/course-offerings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        course_id: bigCourseId,
        academic_term_id: termId,
        instructor_id: instructorId,
        section: 'SOLO-SECTION',
        schedule: 'F 13:00 - 16:00',
        room: 'Room 101',
        capacity: 1,
      });

    expect(res.status).toBe(201);
    tinyOfferingId = res.body.data.id;
  });

  it('should successfully enroll a student in the offering (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: regularStudentId,
        course_offering_id: offeringId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.student_number).toBe('2026-00010');
  });

  it('should prevent duplicate enrollment in the same offering (409 Conflict)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: regularStudentId,
        course_offering_id: offeringId,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already enrolled');
  });

  it('should enforce capacity limits (400 Bad Request when section full)', async () => {
    // 1st student takes the only seat in tinyOfferingId
    const firstEnroll = await request(app.getHttpServer())
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: regularStudentId,
        course_offering_id: tinyOfferingId,
      });
    expect(firstEnroll.status).toBe(201);

    // 2nd student tries to enroll in full section
    const secondEnroll = await request(app.getHttpServer())
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: lowUnitStudentId,
        course_offering_id: tinyOfferingId,
      });

    expect(secondEnroll.status).toBe(400);
    expect(secondEnroll.body.message).toContain('maximum student capacity');
  });

  it('should prevent irregular/underload student from exceeding max allowed units (400 Bad Request)', async () => {
    // lowUnitStudentId has max_allowed_units: 3.
    // First enrolled course CS101 is 3 units -> hits 3/3 units
    const enrollCS = await request(app.getHttpServer())
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: lowUnitStudentId,
        course_offering_id: offeringId,
      });
    expect(enrollCS.status).toBe(201);

    // Create another course to test unit overflow
    const extraCourse = await prisma.course.create({
      data: { course_code: 'EXTRA101', course_title: 'Extra Course', units: 3 },
    });
    const extraOffering = await prisma.courseOffering.create({
      data: {
        course_id: extraCourse.id,
        academic_term_id: termId,
        instructor_id: instructorId,
        section: 'EXTRA-1',
        schedule: 'Sat 08:00 - 11:00',
        room: 'Room 501',
      },
    });

    // Second enrollment would reach 6 units > 3 max allowed units
    const overflowRes = await request(app.getHttpServer())
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: lowUnitStudentId,
        course_offering_id: extraOffering.id,
      });

    expect(overflowRes.status).toBe(400);
    expect(overflowRes.body.success).toBe(false);
    expect(overflowRes.body.message).toContain('exceeds maximum allowed units');
  });

  it('should list all students enrolled in a course offering (200)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/course-offerings/${offeringId}/students`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
