import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGatewayRequestDto {
  @ApiProperty({ name: 'name' })
  @IsString()
  name: string;
}
