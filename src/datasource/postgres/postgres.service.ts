import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// const prisma = new PrismaClient({ adapter });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter });
  }

  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();

      this.logger.log('PostgreSQL database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL', error);

      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();

      this.logger.log('PostgreSQL database disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect from PostgreSQL', error);

      throw error;
    }
  }
}
