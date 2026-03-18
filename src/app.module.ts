import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { GatewaysModule } from './gateways/gateways.module';
import { AlertsModule } from './alerts/alerts.module';
import { ThresholdsModule } from './thresholds/thresholds.module';
import { AuditLogModule } from './audit-log/audit.module';
import { ApiClientModule } from './api-client/api-client.module';
import { CostsModule } from './costs/costs.module';
import { KeysModule } from './keys/keys.module';
import { UsersModule } from './users/users.module';
import { CommandModule } from './command/command.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AdminModule,
    GatewaysModule,
    AlertsModule,
    ThresholdsModule,
    AuditLogModule,
    ApiClientModule,
    CostsModule,
    KeysModule,
    UsersModule,
    CommandModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
