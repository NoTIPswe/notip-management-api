export class SetThresholdSensorResponseDto {
  sensorId: string | null;
  sensorType: string | null;
  minValue: number;
  maxValue: number;
  updatedAt: Date;
}
