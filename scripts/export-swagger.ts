import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

async function exportSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Student Information Management System REST API')
    .setDescription(
      'Comprehensive RESTful API for Student Information Management System (SIMS). Developed for Special Topics Laboratory Activity II.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'bearer-jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = path.resolve(__dirname, '../docs/swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`✅ OpenAPI documentation exported to ${outputPath}`);
  await app.close();
  process.exit(0);
}

exportSwagger();
