import { GatewayStatus } from '../../common/enums/gateway.enum';

export class UpdateGatewayResponseDto {
  id: string;
  name: string;
  status: GatewayStatus;
  updatedAt: Date;
}
