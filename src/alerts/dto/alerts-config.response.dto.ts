import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AlertsConfigResponseDto {
  @ApiProperty({ name: 'default_timeout_ms' })
  @Expose({ name: 'default_timeout_ms' })
  defaultTimeoutMs: number;
  @ApiProperty({
    name: 'gateway_overrides',
    type: () => [AlertsGatewayOverridesResponseDto],
  })
  @Expose({ name: 'gateway_overrides' })
  gatewayOverrides: AlertsGatewayOverridesResponseDto[];
}

export class AlertsGatewayOverridesResponseDto {
  @ApiProperty({ name: 'gateway_id' })
  @Expose({ name: 'gateway_id' })
  gatewayId: string;
  @ApiProperty({ name: 'timeout_ms' })
  @Expose({ name: 'timeout_ms' })
  timeoutMs: number;
}
