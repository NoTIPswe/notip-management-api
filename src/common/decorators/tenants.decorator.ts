// common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  ( ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.effectiveTenantId;
  },
);
