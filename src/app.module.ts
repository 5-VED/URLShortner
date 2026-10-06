import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './datasource/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './datasource/postgres/postgres.module';
import { UserModule } from './modules/user/user.module';
import { UrlModule } from './modules/url/url.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    PostgresModule,
    UrlModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
