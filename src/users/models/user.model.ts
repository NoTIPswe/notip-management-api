import { UsersRole } from '../enums/users.enum';

export class UserModel {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  role: UsersRole;
  permissions: string[] | null;
  lastAccess: Date | null;
  createdAt: Date;
}
