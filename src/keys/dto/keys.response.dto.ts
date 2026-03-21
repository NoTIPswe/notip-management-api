import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class KeysResponseDto {
  @ApiProperty({ name: 'gateway_id' })
  @Expose({ name: 'gateway_id' })
  gatewayId: string;
  @ApiProperty({ name: 'key_material', type: 'string', format: 'byte' })
  @Expose({ name: 'key_material' })
  keyMaterial: Buffer;
  @ApiProperty({ name: 'key_version' })
  @Expose({ name: 'key_version' })
  keyVersion: number;
}
