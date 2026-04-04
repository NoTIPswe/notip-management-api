import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeysController } from './controller/keys.controller';
import { ProvisioningController } from './controller/provisioning.controller';
import { KeysService } from './services/keys.service';
import { GatewaysKeysPersistenceService } from './services/keys.persistence.service';
import { ProvisioningNatsResponderService } from './services/provisioning-nats-responder.service';
import { KeyEntity } from './entities/key.entity';
import { GatewaysModule } from '../gateways/gateways.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyEntity]),
    AuditLogModule,
    GatewaysModule,
  ],
  controllers: [KeysController, ProvisioningController],
  providers: [
    KeysService,
    GatewaysKeysPersistenceService,
    ProvisioningNatsResponderService,
  ],
})
export class KeysModule {}
