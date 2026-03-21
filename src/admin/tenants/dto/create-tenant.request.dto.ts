import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class CreateTenantRequestDto {
  @IsString()
  @ApiProperty({ name: 'name' })
  name: string;

  @IsEmail()
  @ApiProperty({ name: 'admin_email' })
  @Expose({ name: 'admin_email' })
  adminEmail: string;

  @IsString()
  @ApiProperty({ name: 'admin_name' })
  @Expose({ name: 'admin_name' })
  adminName: string;

  @IsString()
  @ApiProperty({
    name: 'admin_password',
    type: String,
    example: 'Temp_1234_A!',
  })
  @Expose({ name: 'admin_password' })
  adminPassword: string;
}
