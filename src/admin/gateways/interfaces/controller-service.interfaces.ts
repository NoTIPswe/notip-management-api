export interface GetGatewaysInput {
  tenantId?: string;
}

export interface AddGatewayInput {
  factoryId: string;
  tenantId: string;
  factoryKeyHash: string;
}
