import { Injectable } from '@nestjs/common';
import {
  JetStreamClient,
  JetStreamHandler,
  JetStreamMessage,
  NatsHandler,
  NatsMessage,
} from './jetstream.client';
import { CommandAckPayload } from '../command/interfaces/command-ack.interface';

type SubscriptionHandler = {
  subject: string;
  handler: JetStreamHandler;
};

@Injectable()
export class MockJetStreamClient extends JetStreamClient {
  private readonly handlers: SubscriptionHandler[] = [];
  private readonly coreHandlers = new Map<string, NatsHandler>();

  async subscribe(subject: string, handler: JetStreamHandler): Promise<void> {
    this.handlers.push({ subject, handler });
    return Promise.resolve();
  }

  async subscribeCore(subject: string, handler: NatsHandler): Promise<void> {
    this.coreHandlers.set(subject, handler);
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
    subject?: string,
  ): Promise<void> {
    if (this.handlers.length === 0) return;

    const matchingHandlers = subject
      ? this.handlers.filter(({ subject: pattern }) =>
          this.matchesSubject(pattern, subject),
        )
      : this.handlers;

    for (const subscription of matchingHandlers) {
      const message: JetStreamMessage = {
        data: Buffer.from(JSON.stringify(payload)),
        subject: subject ?? subscription.subject,
        ack: () => undefined,
      };
      await subscription.handler(message);
    }
  }

  async emitCore(
    payload: Record<string, unknown>,
    subject: string,
  ): Promise<void> {
    const handler = this.coreHandlers.get(subject);
    if (!handler) {
      return;
    }

    const message: NatsMessage = {
      data: Buffer.from(JSON.stringify(payload)),
      subject,
      respond: () => true,
    };
    await handler(message);
  }

  private matchesSubject(pattern: string, subject: string): boolean {
    if (pattern === '>') {
      return true;
    }

    if (pattern.endsWith('>')) {
      const prefix = pattern.slice(0, -1);
      return subject.startsWith(prefix);
    }

    return pattern === subject;
  }
}
