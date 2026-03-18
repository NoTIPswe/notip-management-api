import { GatewayStatus } from 'src/common/enums/gateway.enum';

export class UpdateGatewayResponseDto {
  id: string;
  name: string;
  status: GatewayStatus;
  updatedAt: Date;
}
