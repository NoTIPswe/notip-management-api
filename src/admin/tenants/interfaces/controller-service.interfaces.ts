import { TenantStatus } from '../../../common/enums/tenants.enum';

export interface DeleteTenantInput {
  id: string;
}

export interface CreateTenantInput {
  name: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
}

export interface UpdateTenantInput {
  name?: string;
  status?: TenantStatus;
  suspensionIntervalDays?: number | null;
  id: string;
}
