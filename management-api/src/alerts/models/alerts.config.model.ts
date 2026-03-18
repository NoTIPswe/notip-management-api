export class AlertsConfigModel {
  id: string;
  tenantId: string;
  gatewayId: string[];
  gatewayTimeoutMs: number[];
  tenantTimeoutMs: number;
}
