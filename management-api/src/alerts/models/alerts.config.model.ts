export class AlertsConfigModel {
  defaultTimeoutMs: number;
  gatewayOverrides: {
    gatewayId: string;
    gatewayTimeoutMs: number;
  }[];
}
