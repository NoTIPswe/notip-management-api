import { UsersRole } from '../enums/users.enum';

export interface GetUsersInput {
  tenantId: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  role: UsersRole;
  tenantId: string;
  password: string;
}

export interface UpdateUserInput {
  id: string;
  tenantId: string;
  email?: string;
  username?: string;
  role?: UsersRole;
  password?: string;
  permissions?: string[];
}

export interface DeleteUsersInput {
  ids: string[];
  requesterId?: string;
  requesterRole?: UsersRole;
}
