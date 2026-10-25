import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../datasource/postgres/postgres.service';
import { CreateSessionDto } from './Interface/ISession';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateSessionDto) {
    return this.prisma.session.create({
      data: {
        userId: dto.userId,
        tokenHash: dto.tokenHash,
        expiresAt: dto.expiresAt,
        userAgent: dto.userAgent ?? null,
        ipAddress: dto.ipAddress ?? null,
      },
    });
  }
}
