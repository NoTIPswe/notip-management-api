import { UsersRole } from '../enums/users.enum';

export class UpdateUserRequestDto {
  name?: string;
  email?: string;
  role?: UsersRole;
  permissions?: string[];
}
