import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UsersRole } from '../enums/users.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ name: 'username' })
  username?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @ApiProperty({ name: 'email' })
  email?: string;
  @IsOptional()
  @IsEnum(UsersRole)
  @ApiProperty({ name: 'role', type: String, enum: UsersRole })
  role?: UsersRole;
  @IsOptional()
  @IsArray()
  @ApiProperty({ name: 'permissions', type: [String] })
  permissions?: string[];
}
