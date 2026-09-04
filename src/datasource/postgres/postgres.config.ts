import { ConfigService } from '@nestjs/config';

export const postgresConfig = (config: ConfigService) => ({
  host: config.get<string>('POSTGRES_HOST'),
  port: config.get<number>('POSTGRES_PORT'),
  username: config.get<string>('POSTGRES_USERNAME'),
  password: config.get<string>('POSTGRES_PASSWORD'),
  database: config.get<string>('POSTGRES_NAME'),
});
