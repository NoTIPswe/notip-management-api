import { Injectable } from '@nestjs/common';
import {
  JetStreamClient,
  JetStreamHandler,
  JetStreamMessage,
  NatsHandler,
} from './jetstream.client';
import { CommandAckPayload } from '../command/interfaces/command-ack.interface';

@Injectable()
export class MockJetStreamClient extends JetStreamClient {
  private handler: JetStreamHandler | null = null;

  async subscribe(_subject: string, handler: JetStreamHandler): Promise<void> {
    this.handler = handler;
    return Promise.resolve();
  }

  async subscribeCore(_subject: string, _handler: NatsHandler): Promise<void> {
    void _subject;
    void _handler;
    return Promise.resolve();
  }

  async publish(
    _subject: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _data: Buffer, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<void> {
    return Promise.resolve();
  }

  async request(
    _subject: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _data: Buffer, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<Buffer> {
    const GB = 1024 * 1024 * 1024;
    return Promise.resolve(Buffer.from(JSON.stringify({ dataSizeAtRest: GB })));
  }

  async emit(
    payload: CommandAckPayload | Record<string, unknown>,
    subject = 'test.subject',
  ): Promise<void> {
    if (!this.handler) return;
    const message: JetStreamMessage = {
      data: Buffer.from(JSON.stringify(payload)),
      subject,
      ack: () => undefined,
    };
    await this.handler(message);
  }
}
