import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  connect,
  ConnectionOptions,
  consumerOpts,
  createInbox,
  JetStreamClient as NatsJetStream,
  JetStreamSubscription,
  NatsConnection,
} from 'nats';
import {
  JetStreamClient,
  JetStreamHandler,
  JetStreamMessage,
} from './jetstream.client';

@Injectable()
export class NatsJetStreamClient
  extends JetStreamClient
  implements OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(NatsJetStreamClient.name);
  private connection: NatsConnection | null = null;
  private jetStream: NatsJetStream | null = null;
  private readonly subscriptions: JetStreamSubscription[] = [];
  private connectingPromise: Promise<void> | null = null;

  async subscribe(subject: string, handler: JetStreamHandler): Promise<void> {
    await this.ensureConnected();

    if (!this.jetStream) {
      throw new Error('JetStream client is not connected');
    }

    const options = consumerOpts();
    options.manualAck();
    options.ackExplicit();
    options.deliverTo(createInbox());
    options.deliverNew();
    options.durable(this.buildDurableName(subject));

    const subscription = await this.jetStream.subscribe(subject, options);
    this.subscriptions.push(subscription);

    this.consumeMessages(subscription, handler, subject);
    this.logger.log(`Subscribed to JetStream subject: ${subject}`);
  }

  async publish(subject: string, data: Buffer): Promise<void> {
    await this.ensureConnected();

    if (!this.jetStream) {
      throw new Error('JetStream client is not connected');
    }

    try {
      const ack = await this.jetStream.publish(subject, data);
      if (ack.duplicate) {
        this.logger.warn(
          `JetStream publish to ${subject} reported a duplicate message`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to publish message to JetStream subject: ${subject}`,
        error as Error,
      );
      throw error;
    }
  }

  async request(subject: string, data: Buffer): Promise<Buffer> {
    await this.ensureConnected();

    if (!this.connection) {
      throw new Error('NATS connection is not established');
    }

    try {
      const response = await this.connection.request(subject, data, {
        timeout: 5000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Failed to request from NATS subject: ${subject}`,
        error as Error,
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeConnection();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.closeConnection();
  }

  private consumeMessages(
    subscription: JetStreamSubscription,
    handler: JetStreamHandler,
    subject: string,
  ): void {
    void (async () => {
      for await (const message of subscription) {
        const wrappedMessage: JetStreamMessage = {
          data: Buffer.from(message.data),
          ack: () => message.ack(),
        };

        try {
          await handler(wrappedMessage);
        } catch (error) {
          this.logger.error(
            `Unhandled error while processing JetStream message on ${subject}`,
            error as Error,
          );
        }
      }
    })();
  }

  private async ensureConnected(): Promise<void> {
    if (this.connection && this.jetStream) {
      return;
    }

    if (!this.connectingPromise) {
      this.connectingPromise = this.connectInternal();
    }

    try {
      await this.connectingPromise;
    } finally {
      this.connectingPromise = null;
    }
  }

  private async connectInternal(): Promise<void> {
    const servers = this.resolveServers();
    const connectionOptions = this.buildConnectionOptions(servers);

    this.connection = await connect(connectionOptions);
    this.jetStream = this.connection.jetstream();

    this.logger.log(`Connected to NATS servers: ${servers.join(', ')}`);
  }

  private buildConnectionOptions(servers: string[]): ConnectionOptions {
    const options: ConnectionOptions = {
      servers,
      name: process.env.NATS_CLIENT_NAME ?? 'management-api',
    };

    this.applyTlsOptions(options);

    const token = process.env.NATS_TOKEN?.trim();
    const user = process.env.NATS_USER?.trim();
    const pass = process.env.NATS_PASSWORD?.trim();

    if (token) {
      options.token = token;
      this.logger.log('Using token-based NATS authentication');
      return options;
    }

    if (user && pass) {
      options.user = user;
      options.pass = pass;
      this.logger.log('Using user/password NATS authentication');
      return options;
    }

    this.logger.log('Using unauthenticated NATS connection');
    return options;
  }

  private applyTlsOptions(options: ConnectionOptions): void {
    const caFile = process.env.NATS_TLS_CA;
    const certFile = process.env.NATS_TLS_CERT;
    const keyFile = process.env.NATS_TLS_KEY;

    if (!(caFile && certFile && keyFile)) {
      return;
    }

    options.tls = {
      caFile,
      certFile,
      keyFile,
    };
    this.logger.log('Using mTLS for NATS connection');
  }

  private resolveServers(): string[] {
    const raw = process.env.NATS_SERVERS ?? process.env.NATS_URL;
    if (!raw) {
      return ['nats://localhost:4222'];
    }

    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private buildDurableName(subject: string): string {
    const prefix = process.env.NATS_DURABLE_PREFIX ?? 'management-api';
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${prefix}_${sanitizedSubject}`;
  }

  private async closeConnection(): Promise<void> {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.length = 0;

    if (this.connection) {
      await this.connection.drain();
      await this.connection.close();
    }

    this.connection = null;
    this.jetStream = null;
  }
}
