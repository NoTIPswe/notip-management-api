import { CommandStatus } from '../enums/command-status.enum';

export interface CommandAckPayload {
  command_id?: string;
  commandId?: string;
  status: CommandStatus | string;
  timestamp: string;
}
