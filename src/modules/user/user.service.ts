import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../../datasource/postgres/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const scrypt = promisify(scryptCallback);

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }

      throw new InternalServerErrorException('Unable to create user');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }
}
