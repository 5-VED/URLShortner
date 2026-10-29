import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UserService } from './user.service';
import { GetUserDto } from './dto/get-user.dto';
import { SignupResponse } from './interface/IUser';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.userService.signUp(createUserDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.userService.login(
      loginDto,
      {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/login',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(HttpStatus.OK)
      .json({ data: { user, accessToken }, success: true, stausCode: 200 });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Query() getUserDto: GetUserDto) {
    return this.userService.getUser(getUserDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Query() deleteUserDto: DeleteUserDto) {
    return this.userService.deleteUser(deleteUserDto);
  }
}
