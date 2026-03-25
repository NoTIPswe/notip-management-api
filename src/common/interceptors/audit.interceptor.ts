import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { AuditLogService } from '../../audit-log/services/audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private readonly auditLog: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      url: string;
      method: string;
      ip: string;
      body: unknown;
    }>();
    const user = request.user;

    return next.handle().pipe(
      tap((data: unknown) => {
        if (!user) return;

        void (async () => {
          try {
            await this.auditLog.logAuditEvent({
              userId: user.effectiveUserId,
              action: auditOptions.action,
              resource: auditOptions.resource,
              tenantId: user.effectiveTenantId || '',
              details: {
                path: request.url,
                method: request.method,
                ip: request.ip,
                input: request.body,
                output: data,
                isImpersonating: user.isImpersonating,
                actorUserId: user.isImpersonating
                  ? user.actorUserId
                  : undefined,
              },
            });
          } catch (e) {
            void e;
          }
        })();
      }),
    );
  }
}
