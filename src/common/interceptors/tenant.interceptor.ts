import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

interface RequestWithUser {
  user?: AuthenticatedUser;
  tenantId?: string;
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    request.tenantId = request.user?.effectiveTenantId;
    return next.handle();
  }
}
