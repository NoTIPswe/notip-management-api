export class KeyModel {
  id: string;
  gatewayId: string;
  keyMaterial: string;
  keyVersion: string;
  createdAt: Date;
  revokedAt: Date | null;
}
