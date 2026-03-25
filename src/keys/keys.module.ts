import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeysController } from './controller/keys.controller';
import { KeysService } from './services/keys.service';
import { GatewaysKeysPersistenceService } from './services/keys.persistence.service';
import { KeyEntity } from './entities/key.entity';
import { GatewaysModule } from '../gateways/gateways.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeyEntity]),
    AuditLogModule,
    GatewaysModule,
  ],
  controllers: [KeysController],
  providers: [KeysService, GatewaysKeysPersistenceService],
})
export class KeysModule {}
