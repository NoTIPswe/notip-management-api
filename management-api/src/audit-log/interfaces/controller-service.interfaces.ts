export interface GetAuditLogsInput {
  from: Date;
  to: Date;
  userId?: string;
  action?: string;
}
