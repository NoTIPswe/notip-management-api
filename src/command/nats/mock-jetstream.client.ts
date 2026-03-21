import { Injectable } from '@nestjs/common';
import {
  JetStreamClient,
  JetStreamHandler,
  JetStreamMessage,
} from './jetstream.client';
import { CommandAckPayload } from '../interfaces/command-ack.interface';

@Injectable()
export class MockJetStreamClient extends JetStreamClient {
  private handler: JetStreamHandler | null = null;

  subscribe(_subject: string, handler: JetStreamHandler): Promise<void> {
    this.handler = handler;
    return Promise.resolve();
  }

  async emit(
    payload: CommandAckPayload | Record<string, unknown>,
  ): Promise<void> {
    if (!this.handler) return;
    const message: JetStreamMessage = {
      data: Buffer.from(JSON.stringify(payload)),
      ack: () => undefined,
    };
    await this.handler(message);
  }
}
