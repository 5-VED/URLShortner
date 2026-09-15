import { Global, Module } from '@nestjs/common';
import { PrismaService } from './postgres.service';

@Global()
@Module({
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PostgresModule { }
