export interface GetAlertsPersistenceInput {
  tenantId: string;
  from: string;
  to: string;
  gatewayId?: string;
}

export interface SetAlertsConfigDefaultPersistenceInput {
  tenantId: string;
  defaultTimeoutMs: number;
}

export interface SetGatewayAlertsConfigPersistenceInput {
  gatewayTimeoutMs: number;
  gatewayId: string;
  tenantId: string;
}
