import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '../../../common/enums/tenants.enum';
import { Expose } from 'class-transformer';

export class UpdateTenantsResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'status', type: String, enum: TenantStatus })
  status: TenantStatus;
  @ApiProperty({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
