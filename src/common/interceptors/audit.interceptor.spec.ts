import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLogService } from '../../audit-log/services/audit.service';

describe('AuditInterceptor', () => {
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
      effectiveTenantId: 'tenant-1',
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
            tenantId: 'tenant-1',
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
});
