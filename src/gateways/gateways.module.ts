import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaysController } from './controller/gateways.controller';
import { GatewaysService } from './services/gateways.service';
import { GatewaysPersistenceService } from './services/gateways.persistence.service';
import { GatewaysNatsService } from './services/gateways.nats.service';
import { GatewaysListener } from './listeners/gateways.listener';
import { GatewayEntity } from './entities/gateway.entity';
import { GatewayMetadataEntity } from './entities/gateway-metadata.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GatewayEntity, GatewayMetadataEntity]),
    forwardRef(() => AlertsModule),
    NatsModule,
  ],
  controllers: [GatewaysController],
  providers: [
    GatewaysService,
    GatewaysPersistenceService,
    GatewaysNatsService,
    GatewaysListener,
  ],
  exports: [GatewaysService, GatewaysPersistenceService],
})
export class GatewaysModule {}
