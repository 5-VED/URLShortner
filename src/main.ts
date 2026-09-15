import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip properties not in the DTO
      forbidNonWhitelisted: true, // throw 400 if unknown props are sent
      transform: true,       // auto-transform payloads to DTO class instances
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('URL Shortener')
    .setDescription('The URL Shortener API description')
    .setVersion('1.0')
    .addTag('URL Shortener')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
