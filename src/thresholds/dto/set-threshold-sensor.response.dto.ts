import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SetThresholdSensorResponseDto {
  @ApiProperty({ name: 'sensor_id' })
  @Expose({ name: 'sensor_id' })
  sensorId: string | null;
  @ApiProperty({ name: 'sensor_type' })
  @Expose({ name: 'sensor_type' })
  sensorType: string | null;
  @ApiProperty({ name: 'min_value' })
  @Expose({ name: 'min_value' })
  minValue: number;
  @ApiProperty({ name: 'max_value' })
  @Expose({ name: 'max_value' })
  maxValue: number;
  @ApiProperty({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
