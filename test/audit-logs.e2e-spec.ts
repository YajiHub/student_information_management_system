import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Audit Trail E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let instructorToken: string;

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

  it('should record a successful mutating request with actor, action, and duration', async () => {
    const code = `AUD${Date.now() % 1000000}`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, name: 'Audit Probe Program' });
    expect(created.status).toBe(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?resource=programs&per_page=50')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const entries = res.body.data.filter(
      (e: any) => e.resource_id === String(created.body.data.id),
    );
    expect(entries.length).toBe(1);
    expect(entries[0].action).toBe('CREATE');
    expect(entries[0].method).toBe('POST');
    expect(entries[0].success).toBe(true);
    expect(entries[0].status_code).toBe(201);
    expect(entries[0].actor_email).toBe('admin@sims.edu');
    expect(entries[0].actor_role).toBe('ADMIN');
    expect(typeof entries[0].duration_ms).toBe('number');
  });

  it('should record rejected writes with the error message and failure flag', async () => {
    const code = `AUD${Date.now() % 1000000}`;
    await request(app.getHttpServer())
      .post('/api/v1/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, name: 'Duplicate Audit Probe' });

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, name: 'Duplicate Audit Probe' });
    expect(duplicate.status).toBe(409);

    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?success=false&per_page=100')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const failure = res.body.data.find(
      (e: any) => e.resource === 'programs' && e.status_code === 409,
    );
    expect(failure).toBeDefined();
    expect(failure.success).toBe(false);
    expect(failure.error_message).toContain('already exists');
  });

  it('should record authentication attempts including the submitted email', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=LOGIN&per_page=100')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((e: any) => e.actor_email === 'admin@sims.edu')).toBe(true);
  });

  it('should never store plaintext passwords in the audit trail', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?per_page=100')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).not.toContain('Password123!');
  });

  it('should audit only mutating traffic and return pagination metadata', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/programs')
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?per_page=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.per_page).toBe(5);
    expect(res.body.meta.total_records).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((e: any) => e.method !== 'GET')).toBe(true);
  });

  it('should restrict the audit trail to administrators (403)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should require authentication for the audit trail (401)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
