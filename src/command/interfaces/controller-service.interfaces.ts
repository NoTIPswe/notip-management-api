export interface SendConfigCommandInput {
  tenantId: string;
  gatewayId: string;
  sendFrequencyMs?: number;
  status?: string;
}

export interface SendFirmwareCommandInput {
  tenantId: string;
  gatewayId: string;
  firmwareVersion: string;
  downloadUrl: string;
}

export interface GetCommandStatusInput {
  tenantId: string;
  gatewayId: string;
  commandId: string;
}
