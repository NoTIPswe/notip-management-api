import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { TenantStatus } from '../../../common/enums/tenants.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateTenantRequestDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ name: 'name' })
  name?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  @ApiProperty({ name: 'status', type: String, enum: TenantStatus })
  status?: TenantStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ name: 'suspension_interval_days' })
  @Expose({ name: 'suspension_interval_days' })
  suspensionIntervalDays?: number;
}
