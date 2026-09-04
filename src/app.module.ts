import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './datasource/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { UrlModule } from './modules/url/url.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere, no need to re-import
      envFilePath: '.env', // optional, this is the default anyway
    }),
    RedisModule,
    UrlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
