import { forwardRef, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaysController } from './controller/gateways.controller';
import { GatewaysService } from './services/gateways.service';
import { GatewaysPersistenceService } from './services/gateways.persistence.service';
import { GatewayStatusNatsResponderService } from './services/gateway-status-nats-responder.service';
import { GatewayEntity } from './entities/gateway.entity';
import { GatewayMetadataEntity } from './entities/gateway-metadata.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GatewayEntity, GatewayMetadataEntity]),
    forwardRef(() => AlertsModule),
    EventEmitterModule,
    NatsModule,
  ],
  controllers: [GatewaysController],
  providers: [
    GatewaysService,
    GatewaysPersistenceService,
    GatewayStatusNatsResponderService,
  ],
  exports: [GatewaysService],
})
export class GatewaysModule {}
