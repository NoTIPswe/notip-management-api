import { ApiProperty } from '@nestjs/swagger';

export class UpdateGatewayRequestDto {
  @ApiProperty({ name: 'name' })
  name?: string;
}
