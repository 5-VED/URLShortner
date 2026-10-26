import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ----------- Security (Helmet & CORS) -----------
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  // ------------------------------------------------
  // app.use(cookieParser()); // needed to read the refresh token cookie later

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
    credentials: true,
  });

  // ------------------------------------------------

  // ----------- Swagger Configuration ---------------
  const config = new DocumentBuilder()
    .setTitle('URL Shortener')
    .setDescription('The URL Shortener API description')
    .setVersion('1.0')
    .addTag('URL Shortener')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  // ---------------------------------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
