export interface GetAuditLogsPersistenceInput {
  from: Date;
  to: Date;
  userId?: string;
  action?: string;
}
