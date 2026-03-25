import { GatewayStatus } from '../enums/gateway.enum';

export class GatewayModel {
  id: string;
  name: string;
  status: GatewayStatus;
  lastSeenAt: Date | null;
  sendFrequencyMs: number | null;
  factoryKey: string;
  factoryId: string;
  createdAt: Date;
  firmwareVersion: string;
  model: string;
  tenantId: string;
  provisioned: boolean;
  updatedAt?: Date;
}
