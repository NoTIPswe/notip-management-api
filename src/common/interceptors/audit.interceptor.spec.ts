import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLogService } from '../../audit-log/services/audit.service';

describe('AuditInterceptor', () => {
  const TENANT_UUID = '11111111-1111-4111-8111-111111111111';

  let interceptor: AuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    auditLogService = {
      logAuditEvent: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;
    interceptor = new AuditInterceptor(reflector, auditLogService);
  });

  it('should not log if audit options are missing', (done) => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const next = { handle: () => of('data') } as CallHandler;
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, next).subscribe(() => {
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(auditLogService.logAuditEvent).not.toHaveBeenCalled();
      done();
    });
  });

  it('should log if audit options and user are present', (done) => {
    const auditOptions = { action: 'test-action', resource: 'test-resource' };
    reflector.getAllAndOverride.mockReturnValue(auditOptions);

    const user = {
      effectiveUserId: 'user-1',
      effectiveTenantId: TENANT_UUID,
      isImpersonating: false,
    };
    const request = {
      user,
      url: '/test',
      method: 'POST',
      ip: '127.0.0.1',
      body: { foo: 'bar' },
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const next = { handle: () => of({ result: 'ok' }) } as CallHandler;

    interceptor.intercept(context, next).subscribe(() => {
      // Use setImmediate to allow for the async logAuditEvent call inside interceptor
      setImmediate(() => {
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(auditLogService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
            action: 'test-action',
            resource: 'test-resource',
            tenantId: TENANT_UUID,
            details: expect.objectContaining({
              path: '/test',
              input: { foo: 'bar' },
              output: { result: 'ok' },
            }) as unknown,
          }),
        );
        done();
      });
    });
  });

  it('should use tenant_id from request body when user tenant is missing', (done) => {
    const auditOptions = { action: 'CREATE_GATEWAY', resource: 'Gateways' };
    reflector.getAllAndOverride.mockReturnValue(auditOptions);

    const request = {
      user: {
        effectiveUserId: 'user-1',
        isImpersonating: false,
      },
      url: '/admin/gateways',
      method: 'POST',
      ip: '127.0.0.1',
      body: { tenant_id: TENANT_UUID, factory_id: 'gw-01' },
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const next = { handle: () => of({ id: 'gateway-1' }) } as CallHandler;

    interceptor.intercept(context, next).subscribe(() => {
      setImmediate(() => {
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(auditLogService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
            tenantId: TENANT_UUID,
          }),
        );
        done();
      });
    });
  });

  it('should skip logging when no valid tenant id is available', (done) => {
    const auditOptions = { action: 'CREATE_GATEWAY', resource: 'Gateways' };
    reflector.getAllAndOverride.mockReturnValue(auditOptions);

    const request = {
      user: {
        effectiveUserId: 'user-1',
        isImpersonating: false,
      },
      url: '/admin/gateways',
      method: 'POST',
      ip: '127.0.0.1',
      body: { tenant_id: '' },
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const next = { handle: () => of({ id: 'gateway-1' }) } as CallHandler;

    interceptor.intercept(context, next).subscribe(() => {
      setImmediate(() => {
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(auditLogService.logAuditEvent).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
