import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogEntity } from '../entities/audit.entity';
import { Repository } from 'typeorm';
import { GetAuditLogsPersistenceInput } from '../interfaces/service-persistence.interface';
@Injectable()
export class AuditLogPersistenceService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly r: Repository<AuditLogEntity>,
  ) {}

  async getAuditLogs(
    input: GetAuditLogsPersistenceInput,
  ): Promise<AuditLogEntity[]> {
    const query = this.r.createQueryBuilder('audit_log');
    query.where('audit_log.tenantId = :tenantId', { tenantId: input.tenantId });
    query.andWhere('audit_log.timestamp >= :from', { from: input.from });
    query.andWhere('audit_log.timestamp <= :to', { to: input.to });

    if (input.userId) {
      query.andWhere('audit_log.userId = :userId', { userId: input.userId });
    }

    if (input.action) {
      query.andWhere('audit_log.action = :action', { action: input.action });
    }

    // Enforce deterministic ordering for API consumers.
    query
      .orderBy('audit_log.timestamp', 'DESC')
      .addOrderBy('audit_log.id', 'DESC');

    return await query.getMany();
  }

  async saveAuditLog(entity: AuditLogEntity): Promise<void> {
    await this.r.save(entity);
  }

  createAuditLog(data: Partial<AuditLogEntity>): AuditLogEntity {
    return this.r.create(data);
  }
}
