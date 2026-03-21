import { IsString } from 'class-validator';

export class CreateApiClientRequestDto {
  @IsString()
  name: string;
}
