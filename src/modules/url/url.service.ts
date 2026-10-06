import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from 'src/datasource/postgres/postgres.service';
// Generates short, URL-safe codes like "aZ3kQ9"
const generateShortCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  6,
);

@Injectable()
export class UrlService {

  constructor(private readonly prisma: PrismaService) { }

}
