import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { User } from '../../../prisma/generated/prisma/client';

import { PrismaService } from '../../datasource/postgres/postgres.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  hashPassword,
  comparePassword,
} from '../../../shared/utils/password.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  async signUp(
    dto: SignupDto,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
      },
    });

    this.logger.log(`New user registered: ${user.email} (id=${user.id})`);

    return {
      message: 'User registered successfully',
      user: this.sanitiseUser(user),
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ message: string; user: Omit<User, 'password'>; tokens: { access_token: string } }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    const passwordMatch = await comparePassword(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.email} (id=${user.id})`);

    const tokens = await this.signToken(user.id, user.email);

    return {
      message: 'Login successful',
      user: this.sanitiseUser(user),
      tokens,
    };
  }

  private async signToken(userId: string, email: string) {
    return {
      access_token: await this.jwtService.signAsync({ sub: userId, email }),
    };
  }

  private sanitiseUser(user: User): Omit<User, 'password'> {
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }
}
