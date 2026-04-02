import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
