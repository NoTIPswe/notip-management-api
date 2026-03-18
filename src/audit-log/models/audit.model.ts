export class AuditLogModel {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  timestamp: Date;
  tenantId: string;
}
