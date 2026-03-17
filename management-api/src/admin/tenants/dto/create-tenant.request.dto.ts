import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateTenantRequestDto {
  @IsString()
  name: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  adminName: string;

  @IsString()
  @IsOptional()
  adminPassword?: string;
}
