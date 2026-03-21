import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

const databaseImports =
  process.env.NODE_ENV === 'test'
    ? []
    : [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const port = Number(configService.get<string>('DB_PORT'));

            return {
              type: 'postgres',
              host: configService.get<string>('DB_HOST', 'localhost'),
              port: Number.isNaN(port) ? 5432 : port,
              username: configService.get<string>('DB_USER', 'postgres'),
              password: configService.get<string>('DB_PASSWORD', 'postgres'),
              database: configService.get<string>('DB_NAME', 'postgres'),
              autoLoadEntities: true,
              synchronize: false,
            };
          },
        }),
      ];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...databaseImports,
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
