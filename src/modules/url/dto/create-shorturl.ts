import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'Url must be a valid URL' })
  @IsNotEmpty()
  url!: string;
}
