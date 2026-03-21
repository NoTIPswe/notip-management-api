import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class SetAlertsConfigDefaultRequestDto {
  @IsNumber()
  @ApiProperty({ name: 'tenant_unreachable_timeout_ms' })
  @Expose({ name: 'tenant_unreachable_timeout_ms' })
  tenantUnreachableTimeoutMs: number;
}
