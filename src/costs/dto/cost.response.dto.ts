import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CostResponseDto {
  @ApiProperty({ name: 'storage_gb' })
  @Expose({ name: 'storage_gb' })
  storageGb: number;
  @ApiProperty({ name: 'bandwidth_gb' })
  @Expose({ name: 'bandwidth_gb' })
  bandwidthGb: number;
}
