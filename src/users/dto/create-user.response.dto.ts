import { ApiProperty } from '@nestjs/swagger';
import { UsersRole } from '../enums/users.enum';
import { Expose } from 'class-transformer';

export class CreateUserResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'username' })
  username: string;
  @ApiProperty({ name: 'email' })
  email: string;
  @ApiProperty({ name: 'role', type: String, enum: UsersRole })
  role: UsersRole;
  @ApiProperty({ name: 'created_at', type: String, format: 'date-time' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
