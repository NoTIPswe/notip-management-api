import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GatewayResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'tenant_id' })
  @Expose({ name: 'tenant_id' })
  tenantId: string;
}
