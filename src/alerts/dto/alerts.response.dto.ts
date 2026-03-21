import { ApiProperty } from '@nestjs/swagger';
import { AlertType } from '../enums/alerts.enum';
import { Expose } from 'class-transformer';

export class AlertsDetailsDto {
  @ApiProperty({ name: 'last_seen', type: String, format: 'date-time' })
  @Expose({ name: 'last_seen' })
  lastSeen: Date;

  @ApiProperty({ name: 'timeout_configured', type: Number })
  @Expose({ name: 'timeout_configured' })
  timeoutConfigured: number;
}

export class AlertsResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'gateway_id' })
  @Expose({ name: 'gateway_id' })
  gatewayId: string;
  @ApiProperty({ name: 'type', type: String, enum: AlertType })
  type: AlertType;
  @ApiProperty({ name: 'details', type: AlertsDetailsDto })
  details: AlertsDetailsDto;
  @ApiProperty({ name: 'created_at', type: String, format: 'date-time' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
