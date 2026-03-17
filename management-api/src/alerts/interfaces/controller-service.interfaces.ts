export interface GetAlertsInput {
  from: string;
  to: string;
  gatewayId?: string;
}

export interface SetAlertsConfigDefaultsInput {
  defaultTimeoutMs: number;
}

export interface SetGatewayAlertsConfigInput {
  gatewayTimeoutMs: number;
  gatewayId: string;
}
