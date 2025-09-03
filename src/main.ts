import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  PrismaExceptionFilter,
  ValidationExceptionFilter
} from './common/filters';
import {
  LoggingInterceptor
} from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global interceptors (ordem importa - executados na ordem definida)
  app.useGlobalInterceptors(
    new LoggingInterceptor()
  );

  // Global exception filters (ordem importa - do mais específico para o mais geral)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('API REST com Autenticação JWT - NestJS')
    .setDescription('API REST moderna para demonstrar autenticação JWT, CRUD de usuários, validação de dados e testes automatizados.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .setContact('Jean', '', 'jpm.work.prog@gmail.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:8080', 'Servidor de desenvolvimento')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port') || 8080;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
