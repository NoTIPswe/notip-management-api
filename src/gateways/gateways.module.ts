import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaysController } from './controller/gateways.controller';
import { GatewaysService } from './services/gateways.service';
import { GatewaysPersistenceService } from './services/gateways.persistence.service';
import { GatewayEntity } from '../common/entities/gateway.entity';
import { GatewayMetadataEntity } from '../common/entities/gateway-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GatewayEntity, GatewayMetadataEntity])],
  controllers: [GatewaysController],
  providers: [GatewaysService, GatewaysPersistenceService],
  exports: [GatewaysService],
})
export class GatewaysModule {}
