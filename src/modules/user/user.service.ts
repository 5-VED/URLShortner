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

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    };
  }

  /**
   * Authenticates an existing user with email + password credentials.
   * - Returns 404 for unknown emails (avoids revealing which accounts exist via timing).
   * - Checks if user is deleted or inactive.
   * - Returns 401 for wrong passwords.
   * - Returns a fresh token pair containing the user's role on success.
   */
  async login(dto: LoginDto): Promise<any> {
    // 1. Look up user by email — include password for bcrypt comparison
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    if (user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('User account is deactivated or deleted');
    }

    // 2. Verify password — use constant-time compare from bcrypt
    const passwordMatch = await comparePassword(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(
      `User logged in: ${user.email} (id=${user.id}, role=${user.role})`,
    );

    return {
      user: this.sanitiseUser(user),
    };
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

    const result = await (this.prisma.user as any).update({
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
