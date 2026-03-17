import { TenantStatus } from 'src/admin/admin.enum';

export class TenantsResponseDto {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
}
