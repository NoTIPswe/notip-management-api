import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AccessPolicyGuard } from './access-policy.guard';
import { MockAuthGuard } from './mock-auth.guard';
import { AuthController } from './controller/auth.controller';
import { ImpersonationService } from './services/impersonation.service';
import { BlockImpersonationGuard } from './block-impersonation.guard';
import { AuditLogModule } from '../audit-log/audit.module';

@Module({
  controllers: [AuthController],
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    AuditLogModule,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    AccessPolicyGuard,
    RolesGuard,
    MockAuthGuard,
    ImpersonationService,
    BlockImpersonationGuard,
    {
      provide: APP_GUARD,
      useClass: process.env.MOCK_AUTH === 'true' ? MockAuthGuard : JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccessPolicyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BlockImpersonationGuard,
    },
  ],
  exports: [
    JwtAuthGuard,
    AccessPolicyGuard,
    RolesGuard,
    BlockImpersonationGuard,
    PassportModule,
  ],
})
export class AuthModule {}
