import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersRole } from '../users/enums/users.enum';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

const parseMockRole = (value?: string): UsersRole => {
  switch (value) {
    case UsersRole.TENANT_ADMIN:
      return UsersRole.TENANT_ADMIN;
    case UsersRole.TENANT_USER:
      return UsersRole.TENANT_USER;
    case UsersRole.SYSTEM_ADMIN:
    default:
      return UsersRole.SYSTEM_ADMIN;
  }
};

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const tenantId = process.env.MOCK_TENANT_ID ?? 'tenant-1';
    const role = parseMockRole(process.env.MOCK_ROLE);

    request.user = {
      actorUserId: 'mock-user',
      actorEmail: 'mock@notip.local',
      actorName: 'Mock User',
      actorRole: role,
      actorTenantId: tenantId,
      effectiveUserId: 'mock-user',
      effectiveEmail: 'mock@notip.local',
      effectiveName: 'Mock User',
      effectiveRole: role,
      effectiveTenantId: tenantId,
      isImpersonating: false,
    };

    return true;
  }
}
