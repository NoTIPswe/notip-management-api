import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GatewayResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;

  @ApiProperty({ name: 'tenant_id' })
  @Expose({ name: 'tenant_id' })
  tenantId: string;

  @ApiProperty({ name: 'factory_id' })
  @Expose({ name: 'factory_id' })
  factoryId: string;

  @ApiProperty({ name: 'model' })
  model: string;

  @ApiProperty({ name: 'provisioned' })
  provisioned: boolean;

  @ApiProperty({ name: 'firmware_version' })
  @Expose({ name: 'firmware_version' })
  firmwareVersion?: string;

  @ApiProperty({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: string;
}
