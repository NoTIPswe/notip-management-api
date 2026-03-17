import { TenantStatus } from '../admin.enum';

export class TenantsModel {
  id: string;
  name: string;
  status: TenantStatus;
  suspensionIntervalDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}
