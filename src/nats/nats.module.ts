import { Module } from '@nestjs/common';
import { JetStreamClient } from './jetstream.client';
import { NatsJetStreamClient } from './nats-jetstream.client';

@Module({
  providers: [
    {
      provide: JetStreamClient,
      useClass: NatsJetStreamClient,
    },
  ],
  exports: [JetStreamClient],
})
export class NatsModule {}
