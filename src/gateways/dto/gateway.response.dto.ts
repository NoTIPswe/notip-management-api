import { ApiProperty } from '@nestjs/swagger';
import { GatewayStatus } from '../../common/enums/gateway.enum';
import { Expose } from 'class-transformer';

export class GatewayResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'status', type: String, enum: GatewayStatus })
  status: GatewayStatus;
  @ApiProperty({ name: 'last_seen_at' })
  @Expose({ name: 'last_seen_at' })
  lastSeenAt: Date | null;
  provisioned: boolean;
  @ApiProperty({ name: 'firmware_version' })
  @Expose({ name: 'firmware_version' })
  firmwareVersion?: string;
  @ApiProperty({ name: 'send_frequency_ms' })
  @Expose({ name: 'send_frequency_ms' })
  sendFrequencyMs?: number | null;
}
