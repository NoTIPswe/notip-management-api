import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaysController } from './gateways.controller';
import { GatewaysService } from './gateways.service';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayEntity } from 'src/common/entities/gateway.entity';
import { GatewayMetadataEntity } from 'src/common/entities/gateway-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GatewayEntity, GatewayMetadataEntity])],
  controllers: [GatewaysController],
  providers: [GatewaysService, GatewaysPersistenceService],
  exports: [GatewaysService],
})
export class GatewaysModule {}
