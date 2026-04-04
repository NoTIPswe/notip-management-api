import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantsController } from './tenants/controller/tenants.controller';
import { TenantsService } from './tenants/services/tenants.service';
import { TenantsPersistenceService } from './tenants/services/tenants.persistence.service';

import { GatewaysController } from './gateways/controller/gateways.controller';
import { GatewaysService } from './gateways/services/gateways.service';
import { GatewaysPersistenceService } from './gateways/services/gateways.persistence.service';
import { GatewayEntity } from '../gateways/entities/gateway.entity';
import { GatewayMetadataEntity } from '../gateways/entities/gateway-metadata.entity';
import { TenantEntity } from '../common/entities/tenant.entity';
import { UserEntity } from '../users/entities/user.entity';
import { KeycloakAdminService } from './tenants/services/keycloak-admin.service';
import { ApiClientModule } from '../api-client/api-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      GatewayEntity,
      GatewayMetadataEntity,
      UserEntity,
    ]),
    ApiClientModule,
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
