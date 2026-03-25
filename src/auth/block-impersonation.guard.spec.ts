import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BlockImpersonationGuard } from './block-impersonation.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuditLogService } from '../audit-log/services/audit.service';
import { UsersRole } from '../users/enums/users.enum';

const createContext = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
    switchToHttp: () => ({
      getRequest: () => ({ user, url: '/test', ip: '127.0.0.1' }),
    }),
  }) as unknown as ExecutionContext;

describe('BlockImpersonationGuard', () => {
  let reflector: Reflector;
  let logAuditEventMock: jest.Mock;
  let auditLogService: AuditLogService;
  let guard: BlockImpersonationGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    logAuditEventMock = jest.fn().mockResolvedValue(undefined);
    auditLogService = {
      logAuditEvent: logAuditEventMock,
    } as unknown as AuditLogService;

    guard = new BlockImpersonationGuard(reflector, auditLogService);
  });

  it('allows requests when no block is required', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const result = await guard.canActivate(createContext());
    expect(result).toBe(true);
  });

  it('allows requests when block is required but user is not impersonating', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const user = { isImpersonating: false };

    const result = await guard.canActivate(createContext(user));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException and logs when block is required and user is impersonating', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const user = {
      isImpersonating: true,
      effectiveUserId: 'eff-1',
      effectiveTenantId: 'ten-1',
      actorUserId: 'act-1',
      actorRole: UsersRole.SYSTEM_ADMIN,
      effectiveRole: UsersRole.TENANT_ADMIN,
    };

    await expect(guard.canActivate(createContext(user))).rejects.toThrow(
      ForbiddenException,
    );
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'IMPERSONATION_BLOCKED',
        userId: 'eff-1',
        tenantId: 'ten-1',
      }),
    );
  });
});
