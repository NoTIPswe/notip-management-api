import { Module } from '@nestjs/common';
import { AuditLogController } from './audit.controller';
import { AuditLogService } from './audit.service';
import { AuditLogPersistenceService } from './audit.persistence.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogPersistenceService]
})
export class AuditLogModule {}
