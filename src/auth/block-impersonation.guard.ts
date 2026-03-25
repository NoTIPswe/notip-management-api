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

@Injectable()
export class BlockImpersonationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
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
        tenantId: user.effectiveTenantId || '',
      });
      throw new ForbiddenException('Action not allowed during impersonation');
    }

    return true;
  }
}
