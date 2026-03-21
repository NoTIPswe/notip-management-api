import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SetAlertsConfigDefaultResponseDto {
  @ApiProperty({ name: 'tenant_id' })
  @Expose({ name: 'tenant_id' })
  tenantId: string;
  @ApiProperty({ name: 'default_timeout_ms' })
  @Expose({ name: 'default_timeout_ms' })
  defaultTimeoutMs: number;
  @ApiProperty({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
