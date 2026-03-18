export class AuditLogResponseDto {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  timestamp: Date;
}
