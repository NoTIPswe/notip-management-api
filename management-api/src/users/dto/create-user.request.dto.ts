import { UsersRole } from '../enums/users.enum';

export class CreateUserRequestDto {
  name: string;
  email: string;
  role: UsersRole;
  password: string;
}
