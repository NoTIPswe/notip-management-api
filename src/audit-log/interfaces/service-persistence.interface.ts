export interface GetAuditLogsPersistenceInput {
  tenantId: string;
  from: Date;
  to: Date;
  userId?: string;
  action?: string;
}
