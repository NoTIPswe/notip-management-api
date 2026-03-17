import { UserRole } from 'src/users/user.enum';

export class UserModel {
  id: string;
  tenantId: string;
  keycloakId: string | null;
  name: string | null;
  email: string | null;
  role: UserRole;
  permissions: string | null;
  lastAccess: Date;
  createdAt: Date;
}
