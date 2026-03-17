import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditPersistenceService } from './audit.persistence.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditPersistenceService]
})
export class AuditModule {}
