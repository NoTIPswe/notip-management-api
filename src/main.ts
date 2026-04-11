import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { ValidationPipe } = await import('@nestjs/common');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NoTIP Management API')
    .setDescription('NoTIP Management API documentation')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .addBearerAuth(undefined, 'bearer')
    .addSecurityRequirements('bearer')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new DatabaseExceptionFilter(),
  );
  await app.listen(process.env.MGMT_API_PORT ?? 3000);
}
bootstrap().catch((error) => {
  console.error('Application bootstrap failed', error);
  process.exit(1);
});
