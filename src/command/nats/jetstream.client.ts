export interface JetStreamMessage {
  data: Buffer;
  ack(): void | Promise<void>;
}

export type JetStreamHandler = (
  message: JetStreamMessage,
) => Promise<void> | void;

export abstract class JetStreamClient {
  abstract subscribe(subject: string, handler: JetStreamHandler): Promise<void>;

  abstract publish(subject: string, data: Buffer): Promise<void>;

  abstract request(subject: string, data: Buffer): Promise<Buffer>;
}
