import { UsersRole } from '../enums/users.enum';

export class UserModel {
  id: string;
  tenantId: string;
  keycloakId: string | null;
  name: string | null;
  email: string | null;
  role: UsersRole;
  permissions: string | null;
  lastAccess: Date;
  createdAt: Date;
}
