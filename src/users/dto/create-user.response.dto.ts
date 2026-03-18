import { UsersRole } from '../enums/users.enum';

export class CreateUserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UsersRole;
  createdAt: Date;
}
