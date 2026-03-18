import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { TenantStatus } from 'src/common/enums/tenants.enum';

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
