import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SendFirmwareRequestDto {
  @ApiProperty({ name: 'firmware_version' })
  @Expose({ name: 'firmware_version' })
  @IsString()
  @IsNotEmpty()
  firmwareVersion: string;

  @ApiProperty({ name: 'download_url' })
  @Expose({ name: 'download_url' })
  @IsUrl()
  downloadUrl: string;
}
