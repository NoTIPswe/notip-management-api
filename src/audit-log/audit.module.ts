import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogController } from './controller/audit.controller';
import { AuditLogService } from './services/audit.service';
import { AuditLogPersistenceService } from './services/audit.persistence.service';
import { AuditLogEntity } from './entities/audit.entity';
import { ProvisioningAuditConsumer } from './services/provisioning-audit.consumer';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), NatsModule],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditLogPersistenceService,
    ProvisioningAuditConsumer,
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
