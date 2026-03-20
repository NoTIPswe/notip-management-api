export interface GetThresholdsInput {
  tenantId: string;
}

export interface SetThresholdDefaultTypeInput {
  tenantId: string;
  sensorType: string;
  minValue: number;
  maxValue: number;
}

export interface SetThresholdSensorInput {
  tenantId: string;
  sensorId: string;
  minValue: number;
  maxValue: number;
  sensorType?: string;
}

export interface DeleteThresholdSensorInput {
  tenantId: string;
  sensorId: string;
}

export interface DeleteThresholdTypeInput {
  tenantId: string;
  sensorType: string;
}
