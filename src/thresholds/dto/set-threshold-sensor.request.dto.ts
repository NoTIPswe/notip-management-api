import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class SetThresholdSensorRequestDto {
  @IsNumber()
  @ApiProperty({ name: 'min_value' })
  @Expose({ name: 'min_value' })
  minValue: number;
  @IsNumber()
  @ApiProperty({ name: 'max_value' })
  @Expose({ name: 'max_value' })
  maxValue: number;
  @IsString()
  @ApiProperty({ name: 'sensor_type' })
  @Expose({ name: 'sensor_type' })
  sensorType?: string;
}
