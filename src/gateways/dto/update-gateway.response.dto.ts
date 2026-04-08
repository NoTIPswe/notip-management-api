import { ApiProperty } from '@nestjs/swagger';
import { GatewayStatus } from '../enums/gateway.enum';
import { Expose } from 'class-transformer';

export class UpdateGatewayResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'status', type: String, enum: GatewayStatus })
  status: GatewayStatus;
  @ApiProperty({ name: 'updated_at', type: String, format: 'date-time' })
  @Expose({ name: 'updated_at' })
  updatedAt: string;
}
