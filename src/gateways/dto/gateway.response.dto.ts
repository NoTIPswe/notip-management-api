import { ApiProperty } from '@nestjs/swagger';
import { GatewayStatus } from '../enums/gateway.enum';
import { Expose } from 'class-transformer';

export class GatewayResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the gateway',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'User-defined name of the gateway',
    example: 'Main Entrance Gateway',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Current connectivity status',
    enum: GatewayStatus,
    example: GatewayStatus.GATEWAY_ONLINE,
    type: 'string',
  })
  status: GatewayStatus;

  @ApiProperty({
    description: 'Timestamp of the last heart-beat received from the gateway',
    name: 'last_seen_at',
    example: '2024-03-24T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @Expose({ name: 'last_seen_at' })
  lastSeenAt: string | null;

  @ApiProperty({
    description: 'Whether the gateway has been provisioned/activated',
    example: true,
    type: 'boolean',
  })
  provisioned: boolean;

  @ApiProperty({
    description: 'Current firmware version installed on the device',
    name: 'firmware_version',
    example: '1.2.3',
    type: 'string',
  })
  @Expose({ name: 'firmware_version' })
  firmwareVersion?: string;

  @ApiProperty({
    description: 'Configured data sending frequency in milliseconds',
    name: 'send_frequency_ms',
    example: 30000,
    type: 'number',
  })
  @Expose({ name: 'send_frequency_ms' })
  sendFrequencyMs: number;
}
