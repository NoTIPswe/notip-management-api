export interface GetAlertsConfigInput {
  tenantId: string;
}

export interface GetAlertsInput {
  tenantId: string;
  from: string;
  to: string;
  gatewayId?: string;
}

export interface SetAlertsConfigDefaultInput {
  tenantId: string;
  defaultTimeoutMs: number;
}

export interface SetGatewayAlertsConfigInput {
  gatewayTimeoutMs: number;
  gatewayId: string;
  tenantId: string;
}
