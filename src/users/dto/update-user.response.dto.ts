import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UsersRole } from '../enums/users.enum';

export class UpdateUserResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'username' })
  username: string;
  @ApiProperty({ name: 'email' })
  email: string;
  @ApiProperty({ name: 'role', type: String, enum: UsersRole })
  role: UsersRole;
  @ApiProperty({ name: 'updated_at', type: String, format: 'date-time' })
  @Expose({ name: 'updated_at' })
  updatedAt: string;
}
