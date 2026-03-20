import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UsersRole } from '../users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

const createContext = (user?: AuthenticatedUser): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  it('allows requests when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('rejects requests without a user when roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UsersRole.TENANT_ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(false);
  });

  it('allows users with a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UsersRole.TENANT_ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const user = {
      actorUserId: '1',
      actorRole: UsersRole.TENANT_ADMIN,
      effectiveUserId: '1',
      effectiveRole: UsersRole.TENANT_ADMIN,
      isImpersonating: false,
    } as AuthenticatedUser;

    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('rejects users with a different role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UsersRole.SYSTEM_ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const user = {
      actorUserId: '1',
      actorRole: UsersRole.TENANT_USER,
      effectiveUserId: '1',
      effectiveRole: UsersRole.TENANT_USER,
      isImpersonating: false,
    } as AuthenticatedUser;

    expect(guard.canActivate(createContext(user))).toBe(false);
  });
});
