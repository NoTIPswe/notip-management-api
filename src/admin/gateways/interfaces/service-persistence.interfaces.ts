export interface GetGatewaysPersistenceInput {
  tenantId?: string;
}

export interface AddGatewayPersistenceInput {
  factoryId: string;
  tenantId: string;
  factoryKeyHash: string;
  model: string;
  firmwareVersion?: string;
}
