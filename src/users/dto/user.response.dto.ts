import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UsersRole } from '../enums/users.enum';

export class UserResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'username' })
  username: string;
  @ApiProperty({ name: 'email' })
  email: string;
  @ApiProperty({ name: 'role', type: String, enum: UsersRole })
  role: UsersRole;
  @ApiProperty({
    name: 'last_access',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Expose({ name: 'last_access' })
  lastAccess: string | null;
}
