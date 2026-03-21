import { CommandStatus } from '../enums/command-status.enum';
import { CommandType } from '../enums/command-type.enum';

export class CommandModel {
  id: string;
  tenantId: string;
  gatewayId: string;
  type: CommandType;
  status: CommandStatus;
  issuedAt: Date;
  ackReceivedAt: Date | null;
  createdAt: Date;
}
