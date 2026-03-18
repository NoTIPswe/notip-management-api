export interface GetGatewaysInput {
  tenantId: string;
}

export interface GetGatewayByIdInput {
  tenantId: string;
  gatewayId: string;
}

export interface UpdateGatewayInput {
  tenantId: string;
  gatewayId: string;
  name?: string;
}

export interface DeleteGatewayInput {
  tenantId: string;
  gatewayId: string;
}
