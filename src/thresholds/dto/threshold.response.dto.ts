export class ThresholdResponseDto {
  sensorType: string | null;
  sensorId: string | null;
  minValue: number;
  maxValue: number;
  updatedAt: Date;
}
