import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogController } from './controller/audit.controller';
import { AuditLogService } from './services/audit.service';
import { AuditLogPersistenceService } from './services/audit.persistence.service';
import { AuditLogEntity } from './entities/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogPersistenceService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
