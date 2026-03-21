import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class SetGatewayAlertsConfigRequestDto {
  @IsNumber()
  @ApiProperty({ name: 'gateway_unreachable_timeout_ms' })
  @Expose({ name: 'gateway_unreachable_timeout_ms' })
  gatewayUnreachableTimeoutMs: number;
}
