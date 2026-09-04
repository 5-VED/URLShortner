import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './datasource/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { UrlModule } from './modules/url/url.module';
import { PostgresModule } from './datasource/postgres/postgres.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    UrlModule,
    PostgresModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
