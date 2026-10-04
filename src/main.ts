import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ----------- Swagger Configuration ---------------
  const config = new DocumentBuilder()
    .setTitle('Task Manager')
    .setDescription('Task Manager API description')
    .setVersion('1.0')
    .addTag('Task Manager')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  // ---------------------------------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
