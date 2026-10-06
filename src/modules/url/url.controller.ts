import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-shorturl';
import { UrlService } from './url.service';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) { }

  @Get('/:shortCode')
  async getShortCode() { }
}
