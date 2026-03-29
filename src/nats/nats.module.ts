import { Module } from '@nestjs/common';
import { JetStreamClient } from './jetstream.client';
import { MockJetStreamClient } from './mock-jetstream.client';
import { NatsJetStreamClient } from './nats-jetstream.client';

@Module({
  providers: [
    {
      provide: JetStreamClient,
      useClass:
        process.env.MOCK_NATS === 'false'
          ? NatsJetStreamClient
          : MockJetStreamClient,
    },
  ],
  exports: [JetStreamClient],
})
export class NatsModule {}
