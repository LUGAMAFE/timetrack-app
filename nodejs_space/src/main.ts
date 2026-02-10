import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS for all origins
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  
  // Log all incoming requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.log(`${req.method} ${req.url}`);
    next();
  });

  // Cache control middleware for Swagger
  const swaggerPath = 'api-docs';
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Time Investment Tracker API')
    .setDescription('API for tracking time investments across categories')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Supabase-Auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'Time Investment Tracker API',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .info .title { color: #1e293b; font-size: 2rem; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; }
    `,
  });

  await app.listen(3000);
  logger.log('Application running on port 3000');
  logger.log(`API Documentation: http://localhost:3000/${swaggerPath}`);
}
bootstrap();
