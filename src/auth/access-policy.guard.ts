import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ACCESS_POLICY_KEY,
  AccessPolicy,
} from '../common/decorators/access-policy.decorator';
import { UsersRole } from '../users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

@Injectable()
export class AccessPolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<AccessPolicy>(
      ACCESS_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!policy || policy === AccessPolicy.PUBLIC) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;

    if (!user) {
      return false;
    }

    if (policy === AccessPolicy.ADMIN) {
      return user.effectiveRole === UsersRole.SYSTEM_ADMIN;
    }

    return !!user.effectiveTenantId;
  }
}
