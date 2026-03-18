import { Exclude, Expose } from 'class-transformer';
import { TenantStatus } from 'src/common/enums/tenants.enum';

export class UpdateTenantsResponseDto {
  id: string;
  name: string;
  status: TenantStatus;
  updatedAt: Date;
}
