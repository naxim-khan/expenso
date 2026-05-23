import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ApiResponseInterceptor } from '../common/interceptors/api-response.interceptor';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor(reflector));
}
