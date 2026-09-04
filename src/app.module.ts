import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './datasource/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { UrlModule } from './modules/url/url.module';
import { PostgresModule } from './datasource/postgres/postgres.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere, no need to re-import
      envFilePath: '.env', // optional, this is the default anyway
    }),
    RedisModule,
    UrlModule,
    PostgresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
