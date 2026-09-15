import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const host = configService.get<string>('POSTGRES_HOST');
    const port = configService.get<string>('POSTGRES_PORT', '5432');
    const username = configService.get<string>('POSTGRES_USERNAME');
    const password = configService.get<string>('POSTGRES_PASSWORD');
    const database = configService.get<string>('POSTGRES_NAME');

    if (!host || !username || !password || !database) {
      throw new Error('PostgreSQL configuration is incomplete');
    }

    const connectionString = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('PostgreSQL connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('PostgreSQL connection closed');
  }
}
