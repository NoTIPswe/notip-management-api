import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidateFactoryKeyRequestDto {
  @ApiProperty({ name: 'factory_id' })
  @IsString()
  @IsNotEmpty()
  factory_id: string;

  @ApiProperty({ name: 'factory_key' })
  @IsString()
  @IsNotEmpty()
  factory_key: string;
}

export class ValidateFactoryKeyResponseDto {
  @ApiProperty()
  gateway_id: string;

  @ApiProperty()
  tenant_id: string;
}

export class ProvisioningCompleteRequestDto {
  @ApiProperty({ name: 'gateway_id' })
  @IsString()
  @IsNotEmpty()
  gateway_id: string;

  @ApiProperty({ name: 'key_material' })
  @IsString()
  @IsNotEmpty()
  key_material: string;

  @ApiProperty({ name: 'key_version' })
  @IsNumber()
  key_version: number;

  @ApiProperty({ name: 'send_frequency_ms', example: 1000 })
  @IsNumber()
  send_frequency_ms: number;
}

export class ProvisioningCompleteResponseDto {
  @ApiProperty()
  success: boolean;
}
