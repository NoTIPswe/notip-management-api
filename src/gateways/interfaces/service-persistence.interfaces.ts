export interface GetGatewaysPersistenceInput {
  tenantId: string;
}

export interface GetGatewayByIdPersistenceInput {
  tenantId: string;
  gatewayId: string;
}

export interface UpdateGatewayPersistenceInput {
  tenantId: string;
  gatewayId: string;
  name?: string;
}

export interface DeleteGatewayPersistenceInput {
  tenantId: string;
  gatewayId: string;
}
