import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ACCESS_POLICY_KEY,
  AccessPolicy,
} from '../common/decorators/access-policy.decorator';
import { UsersRole } from '../users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../common/entities/tenant.entity';
import { TenantStatus } from '../common/enums/tenants.enum';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

@Injectable()
export class AccessPolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<AccessPolicy>(
      ACCESS_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!policy || policy === AccessPolicy.PUBLIC) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;

    if (!user) {
      return false;
    }

    if (policy === AccessPolicy.ADMIN) {
      return user.effectiveRole === UsersRole.SYSTEM_ADMIN;
    }

    if (!user.effectiveTenantId) {
      return false;
    }

    if (!this.dataSource?.isInitialized) {
      return true;
    }

    const tenant = await this.getTenant(user.effectiveTenantId);
    if (!tenant) {
      return false;
    }

    const effectiveTenant = await this.reactivateTenantIfExpired(tenant);

    if (effectiveTenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenException('Tenant is suspended');
    }

    return true;
  }

  private isSuspensionExpired(tenant: TenantEntity): boolean {
    return (
      tenant.status === TenantStatus.SUSPENDED &&
      !!tenant.suspensionUntil &&
      tenant.suspensionUntil.getTime() <= Date.now()
    );
  }

  private async reactivateTenantIfExpired(
    tenant: TenantEntity,
  ): Promise<TenantEntity> {
    if (!this.dataSource || !this.isSuspensionExpired(tenant)) {
      return tenant;
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.suspensionIntervalDays = null;
    tenant.suspensionUntil = null;

    return this.dataSource.getRepository(TenantEntity).save(tenant);
  }

  private async getTenant(tenantId: string): Promise<TenantEntity | null> {
    if (!this.dataSource) {
      return null;
    }

    return this.dataSource
      .getRepository(TenantEntity)
      .findOneBy({ id: tenantId });
  }
}
