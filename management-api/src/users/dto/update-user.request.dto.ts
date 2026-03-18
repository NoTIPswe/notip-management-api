import { IsArray, IsEnum, IsString } from 'class-validator';
import { UsersRole } from '../enums/users.enum';

export class UpdateUserRequestDto {
  @IsString()
  name?: string;
  @IsString()
  email?: string;
  @IsEnum(UsersRole)
  role?: UsersRole;
  @IsArray()
  permissions?: string[];
}
