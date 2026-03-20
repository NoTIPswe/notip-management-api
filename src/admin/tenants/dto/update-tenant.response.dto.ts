import { TenantStatus } from '../../../common/enums/tenants.enum';

export class UpdateTenantsResponseDto {
  id: string;
  name: string;
  status: TenantStatus;
  updatedAt: Date;
}
