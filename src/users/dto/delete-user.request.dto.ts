import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteUserRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  ids: string[];
}
