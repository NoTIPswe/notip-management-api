import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UsersRole } from 'src/users/enums/users.enum';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.effectiveTenantId;
  },
);

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.effectiveUserId;
  },
);

export const CurrentUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsersRole | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.effectiveRole;
  },
);
