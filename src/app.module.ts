import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { validate } from './common/env.validation';

const databaseImports =
  process.env.NODE_ENV === 'test'
    ? []
    : [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return {
              type: 'postgres',
              host: configService.get<string>('MGMT_DB_HOST'),
              port: configService.get<number>('MGMT_DB_PORT'),
              username: configService.get<string>('MGMT_DB_USER'),
              password: configService.get<string>('MGMT_DB_PASSWORD'),
              database: configService.get<string>('MGMT_DB_NAME'),
              autoLoadEntities: true,
              synchronize: false,
            };
          },
        }),
      ];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
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
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
