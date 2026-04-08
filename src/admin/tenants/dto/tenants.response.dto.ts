import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '../../../common/enums/tenants.enum';
import { Expose } from 'class-transformer';

export class TenantsResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'status', type: String, enum: TenantStatus })
  status: TenantStatus;
  @ApiProperty({ name: 'created_at', type: String, format: 'date-time' })
  @Expose({ name: 'created_at' })
  createdAt: string;
  @ApiProperty({ name: 'suspension_interval_days', required: false })
  @Expose({ name: 'suspension_interval_days' })
  suspensionIntervalDays: number | null;
}
