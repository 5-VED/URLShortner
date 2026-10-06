import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'url must be a valid URL' })
  @IsNotEmpty()
  url!: string;
}
