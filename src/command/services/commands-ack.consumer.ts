import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JetStreamClient, JetStreamMessage } from '../../nats/jetstream.client';
import { CommandWritingPersistenceService } from './command-writing.persistence.service';
import { CommandAckPayload } from '../interfaces/command-ack.interface';
import { CommandStatus } from '../enums/command-status.enum';

const COMMANDS_ACK_SUBJECT = 'command.ack.>';
const COMMANDS_ACK_STREAM = 'COMMAND_ACKS';
const STATUS_NORMALIZATION_MAP: Record<string, CommandStatus> = {
  ack: CommandStatus.ACK,
  nack: CommandStatus.NACK,
  queued: CommandStatus.QUEUED,
  expired: CommandStatus.EXPIRED,
  timeout: CommandStatus.TIMEOUT,
};

@Injectable()
export class CommandsAckConsumer implements OnModuleInit {
  private readonly logger = new Logger(CommandsAckConsumer.name);

  constructor(
    private readonly jetStreamClient: JetStreamClient,
    private readonly writingPersistence: CommandWritingPersistenceService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.jetStreamClient.subscribe(
      COMMANDS_ACK_STREAM,
      COMMANDS_ACK_SUBJECT,
      async (msg) => {
        this.logger.debug('Received command ack message');
        await this.processMessage(msg);
      },
    );
    this.logger.log(
      `Listening for command acknowledgments on ${COMMANDS_ACK_SUBJECT}`,
    );
  }

  private async processMessage(message: JetStreamMessage): Promise<void> {
    try {
      const payload = this.parsePayload(message.data);
      const commandId = this.resolveCommandId(payload);
      if (!commandId) {
        this.logger.warn('Skipping command ack with missing command id');
        return;
      }
      const status = this.normalizeStatus(payload.status);
      if (!status) {
        this.logger.warn(
          `Skipping command ack with unknown status: ${payload.status}`,
        );
        return;
      }
      const timestamp = new Date(payload.timestamp);
      if (Number.isNaN(timestamp.getTime())) {
        this.logger.warn('Skipping command ack with invalid timestamp');
        return;
      }
      const updatedCommand = await this.writingPersistence.updateStatus({
        commandId,
        status,
        timestamp,
      });
      if (updatedCommand && status === CommandStatus.ACK) {
        await this.writingPersistence.applyAckedCommandEffects(updatedCommand);
      }
      await Promise.resolve(message.ack());
    } catch (error) {
      this.logger.error(
        'Failed to process command ack message',
        error as Error,
      );
    }
  }

  private parsePayload(buffer: Buffer): CommandAckPayload {
    const json = buffer.toString('utf-8');
    return JSON.parse(json) as CommandAckPayload;
  }

  private resolveCommandId(payload: CommandAckPayload): string | null {
    if (
      typeof payload.command_id === 'string' &&
      payload.command_id.length > 0
    ) {
      return payload.command_id;
    }

    if (typeof payload.commandId === 'string' && payload.commandId.length > 0) {
      return payload.commandId;
    }

    return null;
  }

  private normalizeStatus(value?: string): CommandStatus | null {
    if (!value) {
      return null;
    }
    const normalized = value.toLowerCase() as CommandStatus;
    return STATUS_NORMALIZATION_MAP[normalized] ?? null;
  }
}
