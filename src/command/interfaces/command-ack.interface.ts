import { CommandStatus } from '../enums/command-status.enum';

export interface CommandAckPayload {
  commandId: string;
  status: CommandStatus | string;
  timestamp: string;
}
