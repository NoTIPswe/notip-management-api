import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteUserRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  @ApiProperty({ name: 'ids', type: [String] })
  ids: string[];
}
