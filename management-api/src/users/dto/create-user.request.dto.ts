import { IsEnum, IsString } from 'class-validator';
import { UsersRole } from '../enums/users.enum';

export class CreateUserRequestDto {
  @IsString()
  name: string;
  @IsString()
  email: string;
  @IsEnum(UsersRole)
  role: UsersRole;
  @IsString()
  password: string;
}
