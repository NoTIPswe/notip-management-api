import { Module } from '@nestjs/common';
import { AuditLogController } from './controller/audit.controller';
import { AuditLogService } from './services/audit.service';
import { AuditLogPersistenceService } from './services/audit.persistence.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogPersistenceService],
})
export class AuditLogModule {}
