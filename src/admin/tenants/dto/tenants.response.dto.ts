import { TenantStatus } from '../../../common/enums/tenants.enum';

export class TenantsResponseDto {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
}
