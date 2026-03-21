import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class SetThresholdDefaultTypeRequestDto {
  @IsString()
  @ApiProperty({ name: 'sensor_type' })
  @Expose({ name: 'sensor_type' })
  sensorType: string;
  @ApiProperty({ name: 'min_value' })
  @Expose({ name: 'min_value' })
  @IsNumber()
  minValue: number;
  @ApiProperty({ name: 'max_value' })
  @Expose({ name: 'max_value' })
  @IsNumber()
  maxValue: number;
}
