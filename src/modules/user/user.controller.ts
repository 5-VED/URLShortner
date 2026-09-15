import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.userService.signUp(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.userService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.userService.logout(refreshTokenDto);
    return { message: 'Logged out successfully' };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateUser() { }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Query() id: string) {
    return this.userService.getUser(id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Query() id: string) {
    return this.userService.deleteUser(id);
  }
}

