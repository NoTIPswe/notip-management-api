import { Module } from '@nestjs/common';
import { GatewaysController } from './gateways.controller';
import { GatewaysService } from './gateways.service';
import { GatewaysPersistenceService } from './gateways.persistence.service';

@Module({
  controllers: [GatewaysController],
  providers: [GatewaysService, GatewaysPersistenceService]
})
export class GatewaysModule {}
