export interface GetAuditLogsInput {
  tenantId: string;
  from: Date;
  to: Date;
  userId?: string;
  action?: string;
}
