import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SetThresholdDefaultTypeResponseDto {
  @ApiProperty({ name: 'sensor_type' })
  @Expose({ name: 'sensor_type' })
  sensorType: string | null;
  @ApiProperty({ name: 'min_value' })
  @Expose({ name: 'min_value' })
  minValue: number;
  @ApiProperty({ name: 'max_value' })
  @Expose({ name: 'max_value' })
  maxValue: number;
  @ApiProperty({ name: 'updated_at', type: String, format: 'date-time' })
  @Expose({ name: 'updated_at' })
  updatedAt: string;
}
