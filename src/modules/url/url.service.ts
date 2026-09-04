import { Injectable } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-shorturl';
import { customAlphabet } from 'nanoid';

// Generates short, URL-safe codes like "aZ3kQ9"
const generateShortCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  6,
);

@Injectable()
export class UrlService {
  async createShortUrl(dto: CreateUrlDto, userId: string) {
    // Keep generating until we get a shortCode that isn't already taken
    let shortCode: string;
    let exists = true;

    do {
      shortCode = generateShortCode();
      const existing = await this.prisma.uRL.findUnique({
        where: { shortCode },
      });
      exists = !!existing;
    } while (exists);

    const newUrl = await this.prisma.uRL.create({
      data: {
        url: dto.url,
        shortCode,
        userId,
      },
    });

    return newUrl;
  }
}
