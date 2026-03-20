jest.mock('@nestjs/passport', () => {
  class MockAuthGuard {
    canActivate() {
      return 'delegated';
    }
  }

  return {
    AuthGuard: () => MockAuthGuard,
  };
});

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AccessPolicy } from '../common/decorators/access-policy.decorator';

describe('JwtAuthGuard', () => {
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  it('allows public routes without delegating to passport', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.PUBLIC),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('delegates to the passport guard for protected routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(AccessPolicy.TENANT),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(context)).toBe('delegated');
  });
});
