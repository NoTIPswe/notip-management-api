import { CommandStatus } from '../enums/command-status.enum';
import { CommandType } from '../enums/command-type.enum';

export interface QueueCommandPersistenceInput {
  tenantId: string;
  gatewayId: string;
  type: CommandType;
  status: CommandStatus;
  issuedAt: Date;
}

export interface GetCommandPersistenceInput {
  tenantId: string;
  gatewayId: string;
  commandId: string;
}

export interface UpdateCommandStatusPersistenceInput {
  commandId: string;
  status: CommandStatus;
  timestamp: Date;
}
