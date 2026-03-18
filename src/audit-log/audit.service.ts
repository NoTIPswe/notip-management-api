import { Injectable } from '@nestjs/common';
import { AuditLogModel } from './models/audit.model';
import { GetAuditLogsInput } from './interfaces/controller-service.interfaces';
import { AuditLogPersistenceService } from './audit.persistence.service';
import { AuditLogMapper } from './audit.mapper';

@Injectable()
export class AuditLogService {
  constructor(private readonly alps: AuditLogPersistenceService) {}
  async getAuditLogs(input: GetAuditLogsInput): Promise<AuditLogModel[]> {
    const entities = await this.alps.getAuditLogs({
      from: input.from,
      to: input.to,
      userId: input.userId,
      action: input.action,
    });
    return entities.map((e) => AuditLogMapper.toModel(e));
  }
}
