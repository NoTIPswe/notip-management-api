import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { TenantsPersistenceService } from './tenants/tenants.persistence.service';
import { TenantsEntity } from './tenants/tenants.entity';

import { GatewaysController } from './gateways/gateways.controller';
import { GatewaysService } from './gateways/gateways.service';
import { GatewaysPersistenceService } from './gateways/gateways.persistence.service';
import { GatewaysEntity } from './gateways/gateways.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantsEntity, GatewaysEntity]), // ✅ registra le entity
  ],
  controllers: [TenantsController, GatewaysController],
  providers: [
    TenantsService,
    TenantsPersistenceService,
    GatewaysService,
    GatewaysPersistenceService,
  ],
})
export class AdminModule {}
