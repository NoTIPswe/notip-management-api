import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AccessPolicyGuard } from '../src/auth/access-policy.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import {
  ACCESS_POLICY_KEY,
  AdminOnly,
  AccessPolicy,
  Public,
  TenantScoped,
} from '../src/common/decorators/access-policy.decorator';
import { Roles } from '../src/common/decorators/roles.decorator';
import { UsersRole } from '../src/users/enums/users.enum';

type AuthenticatedUser = {
  effectiveRole: UsersRole;
  effectiveTenantId?: string;
};

class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    const policy = new Reflector().getAllAndOverride<AccessPolicy>(
      ACCESS_POLICY_KEY,
      [
      context.getHandler(),
      context.getClass(),
      ],
    );

    if (policy === AccessPolicy.PUBLIC) {
      return true;
    }

    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new UnauthorizedException();
    }

    if (token === 'system-admin') {
      request.user = {
        effectiveRole: UsersRole.SYSTEM_ADMIN,
      } satisfies AuthenticatedUser;
      return true;
    }

    if (token === 'tenant-admin') {
      request.user = {
        effectiveRole: UsersRole.TENANT_ADMIN,
        effectiveTenantId: 'tenant-1',
      } satisfies AuthenticatedUser;
      return true;
    }

    if (token === 'tenant-user') {
      request.user = {
        effectiveRole: UsersRole.TENANT_USER,
        effectiveTenantId: 'tenant-1',
      } satisfies AuthenticatedUser;
      return true;
    }

    throw new UnauthorizedException();
  }
}

@Public()
@Controller('public')
class PublicTestController {
  @Get()
  getPublic() {
    return { ok: true };
  }
}

@AdminOnly()
@Controller('admin-only')
class AdminOnlyTestController {
  @Get()
  getAdminOnly() {
    return { ok: true };
  }
}

@TenantScoped()
@Controller('tenant')
class TenantScopedTestController {
  @Get('any-user')
  @Roles(UsersRole.TENANT_ADMIN, UsersRole.TENANT_USER)
  getTenantUserOrAdmin() {
    return { ok: true };
  }

  @Get('admin-only')
  @Roles(UsersRole.TENANT_ADMIN)
  getTenantAdminOnly() {
    return { ok: true };
  }
}

describe('Auth Guards integration', () => {
  let moduleRef: TestingModule;
  let jwtGuard: FakeJwtAuthGuard;
  let accessPolicyGuard: AccessPolicyGuard;
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [
        PublicTestController,
        AdminOnlyTestController,
        TenantScopedTestController,
      ],
      providers: [Reflector, FakeJwtAuthGuard, AccessPolicyGuard, RolesGuard],
    }).compile();

    jwtGuard = moduleRef.get(FakeJwtAuthGuard);
    accessPolicyGuard = moduleRef.get(AccessPolicyGuard);
    rolesGuard = moduleRef.get(RolesGuard);
  });

  function createExecutionContext(
    controllerClass: Type<unknown>,
    handlerName: string,
    authorization?: string,
  ): ExecutionContext {
    const controller = moduleRef.get(controllerClass, { strict: false });
    const handler = controller[handlerName] as (...args: unknown[]) => unknown;
    const request: { headers: { authorization?: string }; user?: AuthenticatedUser } = {
      headers: {},
    };

    if (authorization) {
      request.headers.authorization = authorization;
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as ExecutionContext;
  }

  function runGuardChain(context: ExecutionContext): boolean {
    const jwtResult = jwtGuard.canActivate(context);
    if (!jwtResult) return false;

    const policyResult = accessPolicyGuard.canActivate(context);
    if (!policyResult) return false;

    return rolesGuard.canActivate(context);
  }

  it('allows public routes without JWT', () => {
    const context = createExecutionContext(PublicTestController, 'getPublic');
    expect(runGuardChain(context)).toBe(true);
  });

  it('returns 401 on protected route without JWT', () => {
    const context = createExecutionContext(
      AdminOnlyTestController,
      'getAdminOnly',
    );
    expect(() => runGuardChain(context)).toThrow(UnauthorizedException);
  });

  it('allows system_admin on admin-only routes', () => {
    const context = createExecutionContext(
      AdminOnlyTestController,
      'getAdminOnly',
      'Bearer system-admin',
    );
    expect(runGuardChain(context)).toBe(true);
  });

  it('returns 403 when tenant_admin hits admin-only routes', () => {
    const context = createExecutionContext(
      AdminOnlyTestController,
      'getAdminOnly',
      'Bearer tenant-admin',
    );
    expect(runGuardChain(context)).toBe(false);
  });

  it('allows tenant_user on tenant routes open to tenant_user+', () => {
    const context = createExecutionContext(
      TenantScopedTestController,
      'getTenantUserOrAdmin',
      'Bearer tenant-user',
    );
    expect(runGuardChain(context)).toBe(true);
  });

  it('returns 403 when tenant_user hits tenant_admin-only routes', () => {
    const context = createExecutionContext(
      TenantScopedTestController,
      'getTenantAdminOnly',
      'Bearer tenant-user',
    );
    expect(runGuardChain(context)).toBe(false);
  });

  it('allows tenant_admin on tenant_admin-only routes', () => {
    const context = createExecutionContext(
      TenantScopedTestController,
      'getTenantAdminOnly',
      'Bearer tenant-admin',
    );
    expect(runGuardChain(context)).toBe(true);
  });
});
