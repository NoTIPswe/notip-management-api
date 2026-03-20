export interface GetThresholdsPersistenceInput {
  tenantId: string;
}

export interface SetThresholdDefaultTypePersistenceInput {
  tenantId: string;
  sensorType: string;
  minValue: number;
  maxValue: number;
}

export interface SetThresholdSensorPersistenceInput {
  tenantId: string;
  sensorId: string;
  minValue: number;
  maxValue: number;
  sensorType?: string;
}

export interface DeleteThresholdSensorPersistenceInput {
  tenantId: string;
  sensorId: string;
}

export interface DeleteThresholdTypePersistenceInput {
  tenantId: string;
  sensorType: string;
}
