import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Log environment variables at startup
  console.log('Environment variables check:');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`MAIL_HOST: ${process.env.MAIL_HOST ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`MAIL_PORT: ${process.env.MAIL_PORT ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`MAIL_USER: ${process.env.MAIL_USER ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
bootstrap();