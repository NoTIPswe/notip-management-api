export class AlertsConfigModel {
  defaultTimeoutMs: number;
  defaultUpdatedAt?: Date;
  gatewayOverrides: {
    gatewayId: string;
    gatewayTimeoutMs: number;
    updatedAt?: Date;
  }[];
}
