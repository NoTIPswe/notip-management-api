import { Exclude, Expose } from 'class-transformer';
import { TenantStatus } from 'src/admin/admin.enum';

export class UpdateTenantsResponseDto {
  id: string;
  name: string;
  status: TenantStatus;
  updatedAt: Date;
}
