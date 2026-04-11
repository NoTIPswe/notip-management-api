import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BLOCK_IMPERSONATION_KEY } from '../common/decorators/block-impersonation.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuditLogService } from '../audit-log/services/audit.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class BlockImpersonationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isBlocked = this.reflector.getAllAndOverride<boolean>(
      BLOCK_IMPERSONATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isBlocked) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser; ip: string; url: string }>();
    const { user } = request;

    if (user?.isImpersonating) {
      const tenantId =
        this.getValidUuid(user.effectiveTenantId) ??
        this.getValidUuid(user.actorTenantId);

      if (tenantId) {
        await this.auditLog.logAuditEvent({
          action: 'IMPERSONATION_BLOCKED',
          userId: user.effectiveUserId,
          resource: context.getClass().name,
          details: {
            actorUserId: user.actorUserId,
            actorRole: user.actorRole,
            actorTenantId: user.actorTenantId,
            effectiveUserId: user.effectiveUserId,
            effectiveRole: user.effectiveRole,
            effectiveTenantId: user.effectiveTenantId,
            path: request.url,
            ip: request.ip,
          },
          tenantId,
        });
      }

      throw new ForbiddenException('Action not allowed during impersonation');
    }

    return true;
  }

  private getValidUuid(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    return UUID_REGEX.test(value) ? value : undefined;
  }
}
