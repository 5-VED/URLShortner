import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateUrlDto } from './dto/create-shorturl';
import { UrlService } from './url.service';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Get('/:shortCode')
  async getShortCode() {}

  @Post('')
  @HttpCode(HttpStatus.OK)
  async createShortCode(@Body() createShortCodeDto: CreateUrlDto) {
    return await this.urlService.addShortCode(createShortCodeDto);
  }
}
