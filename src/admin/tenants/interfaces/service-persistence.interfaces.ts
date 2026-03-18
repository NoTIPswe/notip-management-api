export interface CreateTenantPersistenceInput {
  name: string;
}

export interface DeleteTenantPersistenceInput {
  id: string;
}

export interface UpdateTenantPersistenceInput {
  name?: string;
  status?: string;
  suspensionIntervalDays?: number | null;
  id: string;
}
