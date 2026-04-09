import { UsersRole } from '../enums/users.enum';

export interface CreateUserPersistenceInput {
  email: string;
  username: string;
  role: UsersRole;
  tenantId: string;
  id: string;
  permissions?: string[];
}

export interface UpdateUserPersistenceInput {
  id: string;
  tenantId: string;
  email?: string;
  username?: string;
  role?: UsersRole;
  permissions?: string[];
}
