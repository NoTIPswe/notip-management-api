export interface GetGatewaysPersistenceInput {
  tenantId?: string;
}

export interface AddGatewayPersistenceInput {
  factoryId: string;
  tenantId: string;
  factoryKeyHash: string;
}
