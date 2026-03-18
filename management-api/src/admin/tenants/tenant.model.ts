import { TenantStatus } from 'src/common/enums/tenants.enum';

export class TenantsModel {
  id: string;
  name: string;
  status: TenantStatus;
  suspensionIntervalDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}
