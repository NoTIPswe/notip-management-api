export class KeyModel {
  id: string;
  gatewayId: string;
  keyMaterial: Buffer;
  keyVersion: number;
  createdAt: Date;
  revokedAt: Date | null;
}
