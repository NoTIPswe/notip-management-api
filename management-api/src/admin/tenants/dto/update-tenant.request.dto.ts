import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { TenantStatus } from 'src/admin/admin.enum';

export class UpdateTenantRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  suspensionIntervalDays?: number;
}
