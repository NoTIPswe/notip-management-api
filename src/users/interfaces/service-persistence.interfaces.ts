import { UsersRole } from '../enums/users.enum';

export interface CreateUserPersistenceInput {
  email: string;
  name: string;
  role: UsersRole;
  tenantId: string;
  password: string;
}

export interface UpdateUserPersistenceInput {
  id: string;
  email?: string;
  name?: string;
  role?: UsersRole;
  password?: string;
}
