import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/datasource/postgres/postgres.service';
import { generateShortCode } from '../../utils/generateshortcode.util';
import { CreateUrlDto } from './dto/create-shorturl';

@Injectable()
export class UrlService {
  constructor(private readonly prisma: PrismaService) {}
  async addShortCode(payload: CreateUrlDto) {
    const { url } = payload;

    const existing = await this.prisma.uRL.findFirst({
      where: {
        url,
        // userId: userId ?? null,
        isDeleted: false,
        isActive: true,
      },
    });

    if (existing) {
      return existing;
    }

    const shortCode = generateShortCode();

    const result = await this.prisma.uRL.create({
      data: {
        url,
        shortCode,
      },
    });

    return result;
  }
}
