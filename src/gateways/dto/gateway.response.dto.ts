import { GatewayStatus } from 'src/common/enums/gateway.enum';

export class GatewayResponseDto {
  id: string;
  name: string;
  status: GatewayStatus;
  lastSeenAt: Date | null;
  provisioned: boolean;
  firmwareVersion?: string;
  sendFrequencyMs?: number | null;
}
