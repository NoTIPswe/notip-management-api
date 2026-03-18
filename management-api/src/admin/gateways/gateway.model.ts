export class GatewayModel {
  id: string;
  factoryKeyHash: string | null;
  factoryId: string;
  createdAt: Date;
  firmwareVersion: string;
  model: string;
  tenantId: string;
  provisioned: boolean;
}
