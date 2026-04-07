import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { UsersRole } from '../../users/enums/users.enum';
import { LastAccessInterceptor } from './last-access.interceptor';

describe('LastAccessInterceptor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates last access for authenticated users', () => {
    const usersPersistenceService = {
      touchLastAccess: jest.fn().mockResolvedValue(undefined),
    };
    const interceptor = new LastAccessInterceptor(
      usersPersistenceService as never,
    );

    const request = {
      user: {
        actorUserId: 'u-1',
        actorRole: UsersRole.TENANT_ADMIN,
        effectiveUserId: 'u-1',
        effectiveRole: UsersRole.TENANT_ADMIN,
        effectiveTenantId: 'tenant-1',
        isImpersonating: false,
      },
    };

    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    } as unknown as CallHandler;

    interceptor.intercept(context, next);

    expect(usersPersistenceService.touchLastAccess).toHaveBeenCalledWith('u-1');
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('skips update when request user is missing', () => {
    const usersPersistenceService = {
      touchLastAccess: jest.fn().mockResolvedValue(undefined),
    };
    const interceptor = new LastAccessInterceptor(
      usersPersistenceService as never,
    );

    const request = {};

    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    } as unknown as CallHandler;

    interceptor.intercept(context, next);

    expect(usersPersistenceService.touchLastAccess).not.toHaveBeenCalled();
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('logs warning and continues when update fails', (done) => {
    const usersPersistenceService = {
      touchLastAccess: jest.fn().mockRejectedValue(new Error('db error')),
    };
    const interceptor = new LastAccessInterceptor(
      usersPersistenceService as never,
    );
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const request = {
      user: {
        actorUserId: 'u-1',
        actorRole: UsersRole.TENANT_ADMIN,
        effectiveUserId: 'u-1',
        effectiveRole: UsersRole.TENANT_ADMIN,
        effectiveTenantId: 'tenant-1',
        isImpersonating: false,
      },
    };

    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    } as unknown as CallHandler;

    interceptor.intercept(context, next).subscribe(() => {
      setImmediate(() => {
        expect(warnSpy).toHaveBeenCalled();
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(next.handle).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
