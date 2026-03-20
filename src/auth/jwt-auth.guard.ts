import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  ACCESS_POLICY_KEY,
  AccessPolicy,
} from '../common/decorators/access-policy.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: import('@nestjs/common').ExecutionContext) {
    const policy = this.reflector.getAllAndOverride<AccessPolicy>(
      ACCESS_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (policy === AccessPolicy.PUBLIC) {
      return true;
    }

    return super.canActivate(context);
  }
}
