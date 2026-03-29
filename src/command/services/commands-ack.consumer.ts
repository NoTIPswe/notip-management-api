import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JetStreamClient, JetStreamMessage } from '../../nats/jetstream.client';
import { CommandWritingPersistenceService } from './command-writing.persistence.service';
import { CommandAckPayload } from '../interfaces/command-ack.interface';
import { CommandStatus } from '../enums/command-status.enum';

const COMMANDS_ACK_SUBJECT = 'command.ack.>';
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
    await this.jetStreamClient.subscribe(COMMANDS_ACK_SUBJECT, async (msg) => {
      this.logger.debug('Received command ack message');
      await this.processMessage(msg);
    });
    this.logger.log(
      `Listening for command acknowledgments on ${COMMANDS_ACK_SUBJECT}`,
    );
  }

  private async processMessage(message: JetStreamMessage): Promise<void> {
    try {
      const payload = this.parsePayload(message.data);
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
      await this.writingPersistence.updateStatus({
        commandId: payload.commandId,
        status,
        timestamp,
      });
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

  private normalizeStatus(value?: string): CommandStatus | null {
    if (!value) {
      return null;
    }
    const normalized = value.toLowerCase() as CommandStatus;
    return STATUS_NORMALIZATION_MAP[normalized] ?? null;
  }
}
