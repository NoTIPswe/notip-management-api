export interface CreateTenantPersistenceInput {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string | null;
}

export interface UpdateTenantPersistenceInput {
  name?: string;
  status?: string;
  suspensionIntervalDays?: number | null;
  tenantId: string;
}
