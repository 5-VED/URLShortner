import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-shorturl';
import { UrlService } from './url.service';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}
  @Post('urls')
  async createShortUrl(@Body() dto: CreateUrlDto, @Req() req: any) {
    // Replace with real authenticated user once AuthGuard is in place
    const userId = req.user?.id ?? 'REPLACE_WITH_AUTH_USER_ID';

    const result = await this.urlService.createShortUrl(dto, userId);

    return {
      id: result.id,
      shortCode: result.shortCode,
      shortUrl: `${process.env.BASE_URL ?? 'http://localhost:3000'}/${result.shortCode}`,
      originalUrl: result.url,
    };
  }

  @Get('/:shortCode')
  async getShortCode() {}
}
