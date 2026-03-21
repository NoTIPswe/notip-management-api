import { ApiProperty } from '@nestjs/swagger';
import { UsersRole } from '../enums/users.enum';

export class UpdateUserResponseDto {
  @ApiProperty({ name: 'id' })
  id: string;
  @ApiProperty({ name: 'name' })
  name: string;
  @ApiProperty({ name: 'email' })
  email: string;
  @ApiProperty({ name: 'role', type: String, enum: UsersRole })
  role: UsersRole;
  @ApiProperty({ name: 'updated_at', type: String, format: 'date-time' })
  updateAt: Date;
}
