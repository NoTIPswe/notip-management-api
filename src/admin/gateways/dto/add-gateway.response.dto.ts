import { ApiProperty } from '@nestjs/swagger';

export class AddGatewayResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
}
