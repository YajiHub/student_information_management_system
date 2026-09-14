import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication E2E Tests (Activity 2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

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

    // Ensure a known test user exists
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin@sims.edu' },
      update: { password_hash: passwordHash, status: 'ACTIVE', role: 'ADMIN' },
      create: {
        name: 'System Administrator',
        email: 'admin@sims.edu',
        password_hash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should authenticate successfully with valid credentials and return JWT envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@sims.edu',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@sims.edu');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.user.password_hash).toBeUndefined(); // Never leak password hash

    authToken = res.body.data.access_token;
  });

  it('should reject invalid password with 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@sims.edu',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('should reject non-existent user with 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@sims.edu',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject malformed body with 422 Unprocessable Content', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.email).toBeDefined();
    expect(res.body.errors.password).toBeDefined();
  });

  it('should reject protected endpoint /api/v1/auth/me without token (401)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow access to /api/v1/auth/me with valid Bearer token (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@sims.edu');
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('should succeed on /api/v1/auth/logout with valid Bearer token (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
