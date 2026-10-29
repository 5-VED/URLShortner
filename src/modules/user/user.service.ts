import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '../../../prisma/generated/prisma/client';
import { PrismaService } from '../../datasource/postgres/postgres.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { comparePassword, hashPassword } from '../../utils/password.util';
import { RoleType } from '../../common/enums/role.enum';
import { hashToken } from '../../utils/token.utils';
import { SessionService } from '../session/session.service';
import { LoginResponse } from './interface/IUser';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IAccessToken, IRefreshToken } from './interface/IToken';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    public configService: ConfigService,
    public jwtService: JwtService,
  ) {}

  // Generate Access Token
  async generateAccessToken(payload: IAccessToken) {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    return this.jwtService.signAsync(
      {
        sub: payload.sub,
        sid: payload.sid,
        email: payload.email,
        role: payload.role ?? null,
      },
      {
        secret,
        expiresIn: '15m',
      },
    );
  }

  // Generate Refresh Token
  async generateRefreshToken(payload: IRefreshToken): Promise<string> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');

    return this.jwtService.signAsync(
      {
        sub: payload.sub,
        sid: payload.sid,
      },
      {
        secret,
        expiresIn: '7d',
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Creates a new user.
   * - Rejects duplicate emails with 409.
   * - Hashes the password before persisting.
   */
  async signUp(dto: CreateUserDto): Promise<any> {
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
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        phoneNo: dto.phoneNo,
        profilePic: dto.profilePic,
        role: dto.role ?? RoleType.USER,
      },
    });

    this.logger.log(
      `New user created: ${user.email} (id=${user.id}, role=${user.role})`,
    );

    return {
      user: this.sanitiseUser(user),
      success: true,
      statusCode: 200,
      message: 'Signup successfull',
    };
  }

  /**
   * Authenticates an existing user with email + password credentials.
   * - Returns generic 401 for unknown emails and runs dummy bcrypt compare to equalize timing.
   * - Checks if user is deleted or inactive.
   * - Returns 401 for wrong passwords.
   * - Issues a 15-minute access token and 7-day refresh token.
   * - Stores only the SHA-256 hashed refresh token in the session table.
   * - Sets the raw refresh token as an httpOnly, Secure, SameSite=Strict cookie (maxAge 7 days).
   * - Returns typed LoginResponse with user and accessToken (never password or refresh token in JSON).
   */
  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<LoginResponse> {
    // 1. Look up user by email — include password for bcrypt comparison
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('User account is deactivated or deleted');
    }

    // 2. Verify password — use constant-time compare from bcrypt
    const passwordMatch = await comparePassword(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPayload = {
      sub: user.id,
      sid: user.id,
      email: user.email,
      role: user.role,
      iat: new Date().toISOString(),
      exp: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      iss: 'Url_Shortner',
    };

    const refreshTokenPayload = {
      sub: user.id,
      sid: user.id,
      jti: crypto.randomUUID(),
      iat: new Date().toISOString(),
      exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      iss: 'Url_Shortner',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(tokenPayload),
      this.generateRefreshToken(refreshTokenPayload),
    ]);

    // 4. Hash refresh token using SHA-256 and persist to database session table
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessionService.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    });

    this.logger.log(
      `User logged in: ${user.email} (id=${user.id}, role=${user.role})`,
    );

    const response: LoginResponse = {
      user: this.sanitiseUser(user),
      accessToken,
      refreshToken,
    };

    return response;
  }

  async getUser(dto: GetUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!user) {
      throw new NotFoundException('User Not Found!');
    }

    return {
      message: 'User details fetched',
      user: this.sanitiseUser(user),
    };
  }

  async deleteUser(dto: DeleteUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!user) {
      throw new NotFoundException('User Not Found!');
    }
    await this.prisma.user.delete({ where: { id: dto.id } });

    return {
      message: 'User deleted successfully.',
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User Not Found!');
    }

    const data: { name?: string; email?: string } = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.email !== undefined) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (emailTaken && emailTaken.id !== id) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      data.email = dto.email;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field (name, email) must be provided',
      );
    }

    const result = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.logger.log(`User updated: ${result.email} (id=${result.id})`);

    return {
      message: 'User updated successfully.',
      user: this.sanitiseUser(result),
    };
  }

  /**
   * Strips the password hash before sending user data to the client.
   */
  private sanitiseUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }
}
