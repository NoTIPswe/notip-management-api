export class AlertsConfigResponseDto {
  defaultTimeoutMs: number;
  gatewayOverrides: AlertsGatewayOverridesResponseDto[];
}

export class AlertsGatewayOverridesResponseDto {
  gatewayId: string;
  timeoutMs: number;
}
