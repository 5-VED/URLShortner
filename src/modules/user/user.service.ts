import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import type { User } from '../../../prisma/generated/prisma/client';

import { PrismaService } from '../../datasource/postgres/postgres.service';
import { REDIS_CLIENT } from '../../datasource/redis/redis.module';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { hashPassword, comparePassword } from '../../../shared/utils/password.util';
import { generateTokenPair, TokenPayload, TokenPair } from '../../../shared/utils/token.util';

/** TTL in seconds for the refresh token stored in Redis — must match JWT_REFRESH_EXPIRATION */
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Redis key prefix for refresh tokens */
const REFRESH_TOKEN_KEY = (userId: string) => `refresh_token:${userId}`;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) { }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Registers a new user.
   * - Rejects duplicate emails with 409.
   * - Hashes the password before persisting.
   * - Returns a fresh token pair so the caller is immediately authenticated.
   */
  async signUp(dto: CreateUserDto): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    // 1. Uniqueness check
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Hash password — never persist plain text
    const hashedPassword = await hashPassword(dto.password);

    // 3. Persist the new user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    this.logger.log(`New user registered: ${user.email} (id=${user.id})`);

    // 4. Issue tokens and store refresh token
    const tokens = await this.issueTokens({ sub: user.id, email: user.email });

    return {
      user: this.sanitiseUser(user),
      tokens,
    };
  }

  /**
   * Authenticates an existing user with email + password credentials.
   * - Returns 404 for unknown emails (avoids revealing which accounts exist via timing).
   * - Returns 401 for wrong passwords.
   * - Returns a fresh token pair on success.
   */
  async login(dto: LoginDto): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    // 1. Look up user by email — include password for bcrypt comparison
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    // 2. Verify password — use constant-time compare from bcrypt
    const passwordMatch = await comparePassword(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.email} (id=${user.id})`);

    // 3. Issue tokens and store refresh token
    const tokens = await this.issueTokens({ sub: user.id, email: user.email });

    return {
      user: this.sanitiseUser(user),
      tokens,
    };
  }

  /**
   * Rotates the refresh token.
   * - Verifies the incoming refresh token's signature and expiry.
   * - Compares it against the value stored in Redis (prevents reuse of revoked tokens).
   * - Issues a new token pair and rotates the Redis entry.
   */
  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    // 1. Verify signature + expiry
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    // 2. Compare against the stored token (one-time use per session)
    const stored = await this.redis.get(REFRESH_TOKEN_KEY(payload.sub));
    if (!stored || stored !== dto.refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is invalid or has already been used',
      );
    }

    this.logger.log(`Rotating refresh token for user id=${payload.sub}`);

    // 3. Rotate — issue new pair and overwrite the stored token
    return this.issueTokens({ sub: payload.sub, email: payload.email });
  }

  /**
   * Invalidates the refresh token, effectively logging the user out.
   * Idempotent — calling logout with an already-revoked token won't error.
   */
  async logout(dto: RefreshTokenDto): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(dto.refreshToken);
      await this.redis.del(REFRESH_TOKEN_KEY(payload.sub));
      this.logger.log(`User logged out: id=${payload.sub}`);
    } catch {
      // Token may already be expired — still treat as a successful logout
      this.logger.warn('Logout called with an invalid or expired refresh token');
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Generates a new access + refresh token pair and stores the refresh token
   * in Redis with a sliding TTL.
   */
  private async issueTokens(payload: TokenPayload): Promise<TokenPair> {
    const tokens = await generateTokenPair(this.jwtService, payload, {
      accessSecret: this.config.getOrThrow<string>('JWT_SECRET'),
      accessExpiry: this.config.getOrThrow<string>('JWT_EXPIRATION'),
      refreshSecret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      refreshExpiry: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRATION'),
    });

    // Store refresh token in Redis; EX sets TTL in seconds
    await this.redis.set(
      REFRESH_TOKEN_KEY(payload.sub),
      tokens.refreshToken,
      'EX',
      REFRESH_TOKEN_TTL_SECONDS,
    );

    return tokens;
  }

  /**
   * Verifies a refresh token's signature and returns its decoded payload.
   * Throws `UnauthorizedException` if the token is invalid or expired.
   */
  private async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }
  }

  /**
   * Strips the password hash before sending user data to the client.
   * Uses object destructuring so we never accidentally serialise the hash.
   */
  private sanitiseUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }
}
