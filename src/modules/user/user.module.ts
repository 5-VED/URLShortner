import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RedisModule } from '../../datasource/redis/redis.module';

@Module({
  imports: [
    // RedisModule provides REDIS_CLIENT token used by UserService
    RedisModule,

    // Register JwtModule asynchronously so it can read secrets from ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Default secret for access tokens — individual sign calls can override
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRATION') as StringValue,
        },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  // Export JwtModule in case other modules (e.g., auth guards) need JwtService
  exports: [JwtModule],
})
export class UserModule {}
