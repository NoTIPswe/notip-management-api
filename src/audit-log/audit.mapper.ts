import { AuditLogResponseDto } from './dto/audit-log.response.dto';
import { AuditLogEntity } from './entities/audit.entity';
import { AuditLogModel } from './models/audit.model';

export class AuditLogMapper {
  static toDto(auditLogModel: AuditLogModel): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = auditLogModel.id;
    dto.action = auditLogModel.action;
    dto.userId = this.resolveUserId(auditLogModel);
    dto.timestamp = auditLogModel.timestamp.toISOString();
    dto.details = auditLogModel.details;
    dto.resource = auditLogModel.resource;
    return dto;
  }

  static toModel(auditLogEntity: AuditLogEntity): AuditLogModel {
    return {
      id: auditLogEntity.id,
      tenantId: auditLogEntity.tenantId,
      action: auditLogEntity.action,
      userId: auditLogEntity.userId,
      timestamp: auditLogEntity.timestamp,
      details: auditLogEntity.details,
      resource: auditLogEntity.resource,
    };
  }

  private static resolveUserId(auditLogModel: AuditLogModel): string {
    return this.isProvisioningAudit(auditLogModel.details)
      ? '-'
      : auditLogModel.userId;
  }

  private static isProvisioningAudit(
    details: Record<string, unknown> | undefined,
  ): boolean {
    const sourceSubject = details?.sourceSubject;
    return (
      typeof sourceSubject === 'string' &&
      sourceSubject.startsWith('log.audit.')
    );
  }
}
