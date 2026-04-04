import { AuditLogResponseDto } from './dto/audit-log.response.dto';
import { AuditLogEntity } from './entities/audit.entity';
import { AuditLogModel } from './models/audit.model';

export class AuditLogMapper {
  static toDto(auditLogModel: AuditLogModel): AuditLogResponseDto {
    return {
      id: auditLogModel.id,
      action: auditLogModel.action,
      userId: auditLogModel.userId,
      timestamp: auditLogModel.timestamp.toISOString(),
      details: auditLogModel.details,
      resource: auditLogModel.resource,
    };
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
}
