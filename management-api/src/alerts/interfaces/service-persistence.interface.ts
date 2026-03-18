export interface GetAlertsPersistenceInput {
  from: string;
  to: string;
  gatewayId?: string;
}

export interface SetAlertsConfigDefaultPersistenceInput {
  defaultTimeoutMs: number;
}

export interface SetGatewayAlertsConfigPersistenceInput {
  gatewayTimeoutMs: number;
  gatewayId: string;
  tenantId: string;
}
