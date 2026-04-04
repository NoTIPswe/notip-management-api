import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SetGatewayAlertsConfigResponseDto {
  @ApiProperty({ name: 'gateway_id' })
  @Expose({ name: 'gateway_id' })
  gatewayId: string;
  @ApiProperty({ name: 'timeout_ms' })
  @Expose({ name: 'timeout_ms' })
  timeoutMs: number;
  @ApiProperty({ name: 'updated_at', type: String, format: 'date-time' })
  @Expose({ name: 'updated_at' })
  updatedAt: string;
}
