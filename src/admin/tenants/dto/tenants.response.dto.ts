import { TenantStatus } from 'src/common/enums/tenants.enum';

export class TenantsResponseDto {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
}
