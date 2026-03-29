import { forwardRef, Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeysController } from './controller/keys.controller';
import { ProvisioningController } from './controller/provisioning.controller';
import { KeysService } from './services/keys.service';
import { GatewaysKeysPersistenceService } from './services/keys.persistence.service';
import { KeysNatsService } from './services/keys.nats.service';
import { KeyEntity } from './entities/key.entity';
import { GatewaysModule } from '../gateways/gateways.module';
import { CommandModule } from '../command/command.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyEntity]),
    AuditLogModule,
    forwardRef(() => GatewaysModule),
    forwardRef(() => CommandModule),
    NatsModule,
  ],
  controllers: [KeysController, ProvisioningController],
  providers: [KeysService, GatewaysKeysPersistenceService, KeysNatsService],
})
export class KeysModule {}
