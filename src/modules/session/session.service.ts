import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../datasource/postgres/postgres.service';

export interface CreateSessionDto {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateSessionDto) {
    return (this.prisma as any).session.create({
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
