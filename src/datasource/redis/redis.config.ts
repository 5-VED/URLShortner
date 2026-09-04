// database/redis.config.ts
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

const logger = new Logger('RedisModule');

export const getRedisConfig = (configService: ConfigService): RedisOptions => ({
  host: configService.get<string>('REDIS_HOST'),
  port: configService.get<number>('REDIS_PORT'),
  password: configService.get<string>('REDIS_PASSWORD') || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export const createRedisClient = (configService: ConfigService): Redis => {
  const client = new Redis(getRedisConfig(configService));

  client.on('connect', () => {
    logger.log('✅ Redis connected successfully');
  });

  client.on('error', (err) => {
    logger.error('❌ Redis connection error:', err.stack);
  });

  client.on('reconnecting', () => {
    logger.warn('⚠️ Redis reconnecting...');
  });

  return client;
};
