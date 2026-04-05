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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SENSITIVE_AUDIT_OUTPUT_FIELDS = new Set([
  'clientSecret',
  'client_secret',
]);

interface AuditRequest {
  user?: AuthenticatedUser;
  url: string;
  method: string;
  ip: string;
  body?: unknown;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

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

    const request = context.switchToHttp().getRequest<AuditRequest>();
    const user = request.user;

    return next.handle().pipe(
      tap((data: unknown) => {
        if (!user) return;

        const tenantId = this.resolveTenantId(
          auditOptions,
          request,
          data,
          user,
        );
        if (!tenantId) return;

        void (async () => {
          try {
            await this.auditLog.logAuditEvent({
              userId: user.effectiveUserId,
              action: auditOptions.action,
              resource: auditOptions.resource,
              tenantId,
              details: {
                path: request.url,
                method: request.method,
                ip: request.ip,
                input: request.body,
                output: this.redactSensitiveAuditOutput(data),
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

  private resolveTenantId(
    auditOptions: AuditOptions,
    request: AuditRequest,
    data: unknown,
    user: AuthenticatedUser,
  ): string | undefined {
    const userTenant = this.getValidUuid(user.effectiveTenantId);
    if (userTenant) return userTenant;

    const actorTenant = this.getValidUuid(user.actorTenantId);
    if (actorTenant) return actorTenant;

    const bodyTenant = this.getValidUuid(
      this.getTenantIdCandidate(request.body),
    );
    if (bodyTenant) return bodyTenant;

    const queryTenant = this.getValidUuid(
      this.getTenantIdCandidate(request.query),
    );
    if (queryTenant) return queryTenant;

    const paramsTenant = this.getValidUuid(
      this.getTenantIdCandidate(request.params),
    );
    if (paramsTenant) return paramsTenant;

    if (
      auditOptions.action === 'CREATE_TENANT' ||
      auditOptions.action === 'UPDATE_TENANT' ||
      auditOptions.action === 'DELETE_TENANT'
    ) {
      const paramsId = this.getValidUuid(this.getIdCandidate(request.params));
      if (paramsId) return paramsId;

      const responseId = this.getValidUuid(this.getIdCandidate(data));
      if (responseId) return responseId;
    }

    return undefined;
  }

  private getTenantIdCandidate(value: unknown): unknown {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const container = value as Record<string, unknown>;
    return container.tenantId ?? container.tenant_id;
  }

  private getIdCandidate(value: unknown): unknown {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string, unknown>).id;
  }

  private getValidUuid(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    return UUID_REGEX.test(value) ? value : undefined;
  }

  private redactSensitiveAuditOutput(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactSensitiveAuditOutput(item));
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    const source = value as Record<string, unknown>;
    const redacted: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(source)) {
      if (SENSITIVE_AUDIT_OUTPUT_FIELDS.has(key)) {
        continue;
      }
      redacted[key] = this.redactSensitiveAuditOutput(child);
    }

    return redacted;
  }
}
