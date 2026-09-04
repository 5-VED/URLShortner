import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createRedisClient } from './redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: createRedisClient,
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
