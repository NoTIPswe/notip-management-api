import { ApiProperty } from '@nestjs/swagger';
import { GatewayStatus } from '../enums/gateway.enum';

export class UpdateGatewayResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'status', type: String, enum: GatewayStatus })
  status: GatewayStatus;
  @ApiProperty({ name: 'updated_at', type: String, format: 'date-time' })
  updatedAt: Date;
}
