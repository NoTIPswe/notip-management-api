import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { UsersRole } from 'src/users/enums/users.enum';

describe('TenantInterceptor', () => {
  it('copies the effective tenant id onto the request', () => {
    const interceptor = new TenantInterceptor();
    const request: {
      user: {
        actorUserId: string;
        actorRole: UsersRole;
        effectiveUserId: string;
        effectiveRole: UsersRole;
        effectiveTenantId: string;
        isImpersonating: boolean;
      };
      tenantId?: string;
    } = {
      user: {
        actorUserId: '1',
        actorRole: UsersRole.TENANT_ADMIN,
        effectiveUserId: '1',
        effectiveRole: UsersRole.TENANT_ADMIN,
        effectiveTenantId: 'tenant-1',
        isImpersonating: false,
      },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    };

    interceptor.intercept(context, next);

    expect(request.tenantId).toBe('tenant-1');
    expect(next.handle).toHaveBeenCalledTimes(1);
  });
});
