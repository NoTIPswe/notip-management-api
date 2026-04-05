import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaysController } from './controller/gateways.controller';
import { GatewaysService } from './services/gateways.service';
import { GatewaysPersistenceService } from './services/gateways.persistence.service';
import { GatewayStatusNatsResponderService } from './services/gateway-status-nats-responder.service';
import { GatewayEntity } from './entities/gateway.entity';
import { GatewayMetadataEntity } from './entities/gateway-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GatewayEntity, GatewayMetadataEntity])],
  controllers: [GatewaysController],
  providers: [
    GatewaysService,
    GatewaysPersistenceService,
    GatewayStatusNatsResponderService,
  ],
  exports: [GatewaysService],
})
export class GatewaysModule {}
