import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SendConfigRequestDto {
  @ApiProperty({ name: 'send_frequency_ms', required: false })
  @Expose({ name: 'send_frequency_ms' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sendFrequencyMs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
