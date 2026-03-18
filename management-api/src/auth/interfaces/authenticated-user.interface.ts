import { UsersRole } from 'src/users/enums/users.enum';

export interface AuthenticatedUser {
  actorUserId: string;
  actorEmail?: string;
  actorName?: string;
  actorRole: UsersRole;
  actorTenantId?: string;
  effectiveUserId: string;
  effectiveEmail?: string;
  effectiveName?: string;
  effectiveRole: UsersRole;
  effectiveTenantId?: string;
  isImpersonating: boolean;
}
