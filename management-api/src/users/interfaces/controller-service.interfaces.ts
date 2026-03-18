import { UsersRole } from '../enums/users.enum';

export interface CreateUserInput {
  email: string;
  name: string;
  role: UsersRole;
  password: string;
}

export interface UpdateUserInput {
  id: string;
  email?: string;
  name?: string;
  role?: UsersRole;
  password?: string;
}
