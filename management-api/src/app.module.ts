import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { GatewaysModule } from './gateways/gateways.module';
import { TenantsModule } from './tenants/tenants.module';
import { AlertsModule } from './alerts/alerts.module';
import { ThresholdsModule } from './thresholds/thresholds.module';
import { AuditModule } from './audit/audit.module';
import { ApiClientModule } from './api-client/api-client.module';
import { CostsModule } from './costs/costs.module';
import { KeysModule } from './keys/keys.module';
import { UsersModule } from './users/users.module';
import { CommandModule } from './command/command.module';

@Module({
  imports: [AdminModule, GatewaysModule, TenantsModule, AlertsModule, ThresholdsModule, AuditModule, ApiClientModule, CostsModule, KeysModule, UsersModule, CommandModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
