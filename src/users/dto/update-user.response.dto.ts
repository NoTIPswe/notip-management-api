import { UsersRole } from '../enums/users.enum';

export class UpdateUserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UsersRole;
  updateAt: Date;
}
