import { TenantStatus } from 'src/admin/admin.enum';

export interface CreateTenantInput {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string | null;
}

export interface UpdateTenantInput {
  name?: string;
  status?: TenantStatus;
  suspensionIntervalDays?: number | null;
  tenantId: string;
}
