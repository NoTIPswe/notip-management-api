export class ThresholdModel {
  id: string;
  tenantId: string;
  sensorType: string | null;
  sensorId: string | null;
  minValue: number;
  maxValue: number;
  createdAt: Date;
  updatedAt: Date;
}
