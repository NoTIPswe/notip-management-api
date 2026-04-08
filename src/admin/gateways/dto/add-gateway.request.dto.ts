import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddGatewayRequestDto {
  @ApiProperty({ name: 'factory_id' })
  @Expose({ name: 'factory_id' })
  @IsString()
  @IsNotEmpty()
  factoryId: string;

  @ApiProperty({ name: 'tenant_id' })
  @Expose({ name: 'tenant_id' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ name: 'factory_key' })
  @Expose({ name: 'factory_key' })
  @IsString()
  @IsNotEmpty()
  factoryKey: string;

  @ApiProperty({ name: 'model' })
  @Expose({ name: 'model' })
  @IsString()
  @IsNotEmpty()
  model: string;
}
