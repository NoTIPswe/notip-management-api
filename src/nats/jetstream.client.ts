export interface JetStreamMessage {
  data: Buffer;
  subject?: string;
  ack(): void | Promise<void>;
}

export interface NatsMessage {
  data: Buffer;
  subject: string;
  respond(data: Buffer): boolean;
}

export type JetStreamHandler = (
  message: JetStreamMessage,
) => Promise<void> | void;

export type NatsHandler = (message: NatsMessage) => Promise<void> | void;

export abstract class JetStreamClient {
  abstract subscribe(subject: string, handler: JetStreamHandler): Promise<void>;

  abstract subscribeCore(subject: string, handler: NatsHandler): Promise<void>;

  abstract publish(subject: string, data: Buffer): Promise<void>;

  abstract request(subject: string, data: Buffer): Promise<Buffer>;
}
