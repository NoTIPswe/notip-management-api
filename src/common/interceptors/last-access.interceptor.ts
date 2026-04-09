import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UsersPersistenceService } from '../../users/services/users.persistence.service';

type RequestWithUser = {
  user?: AuthenticatedUser;
};

@Injectable()
export class LastAccessInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LastAccessInterceptor.name);

  constructor(
    private readonly usersPersistenceService: UsersPersistenceService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.effectiveUserId;

    if (userId) {
      void this.usersPersistenceService
        .touchLastAccess(userId)
        .catch((error: unknown) => {
          const reason = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Unable to update last_access for user ${userId}: ${reason}`,
          );
        });
    }

    return next.handle();
  }
}
