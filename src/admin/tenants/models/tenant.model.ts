import { TenantStatus } from '../../../common/enums/tenants.enum';

export class TenantsModel {
  id: string;
  name: string;
  status: TenantStatus;
  suspensionIntervalDays: number | null;
  suspensionUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
