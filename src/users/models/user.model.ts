import { UsersRole } from '../enums/users.enum';

export class UserModel {
  id: string;
  tenantId: string;
  keycloakId: string;
  name: string;
  email: string;
  role: UsersRole;
  permissions: string;
  lastAccess: Date;
  createdAt: Date;
}
