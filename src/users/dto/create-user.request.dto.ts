import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UsersRole } from '../enums/users.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @IsString()
  @ApiProperty({ name: 'name' })
  name: string;
  @IsString()
  @IsEmail()
  @ApiProperty({ name: 'email' })
  email: string;
  @IsEnum(UsersRole)
  @ApiProperty({ name: 'role', type: String, enum: UsersRole })
  role: UsersRole;
  @IsString()
  @ApiProperty({ name: 'password' })
  password: string;
}
