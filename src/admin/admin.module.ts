import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantsController } from './tenants/controller/tenants.controller';
import { TenantsService } from './tenants/services/tenants.service';
import { TenantsPersistenceService } from './tenants/services/tenants.persistence.service';

import { GatewaysController } from './gateways/gateways.controller';
import { GatewaysService } from './gateways/gateways.service';
import { GatewaysPersistenceService } from './gateways/gateways.persistence.service';
import { GatewayEntity } from '../common/entities/gateway.entity';
import { TenantEntity } from '../common/entities/tenant.entity';
import { UserEntity } from '../users/entities/user.entity';
import { KeycloakAdminService } from './tenants/services/keycloak-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, GatewayEntity, UserEntity]),
  ],
  controllers: [TenantsController, GatewaysController],
  providers: [
    TenantsService,
    TenantsPersistenceService,
    KeycloakAdminService,
    GatewaysService,
    GatewaysPersistenceService,
  ],
})
export class AdminModule {}
