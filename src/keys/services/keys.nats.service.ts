import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JetStreamClient } from '../../nats/jetstream.client';
import { KeysService } from './keys.service';

@Injectable()
export class KeysNatsService implements OnModuleInit {
  private readonly logger = new Logger(KeysNatsService.name);

  constructor(
    private readonly nats: JetStreamClient,
    private readonly keysService: KeysService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.nats.subscribeCore(
      'internal.mgmt.provisioning.complete',
      async (msg) => {
        try {
          const payload = JSON.parse(msg.data.toString()) as {
            gateway_id: string;
            key_material: string;
            key_version: number;
          };

          // Use completeProvisioning from KeysService
          // Since sendFrequencyMs is not in the NATS payload, we pass null or a default.
          // The existing method expects a number, so we'll use a default if it's missing or update the method.
          // Looking at KeysService, it uses it to update GatewayMetadataEntity.
          await this.keysService.completeProvisioning(
            payload.gateway_id,
            payload.key_material,
            payload.key_version,
            60000, // Default sendFrequencyMs
          );

          msg.respond(Buffer.from(JSON.stringify({ success: true })));
        } catch (error) {
          this.logger.error('Failed to complete provisioning', error as Error);
          msg.respond(
            Buffer.from(
              JSON.stringify({
                success: false,
                error: (error as Error).message,
              }),
            ),
          );
        }
      },
    );

    this.logger.log('Keys NATS internal listeners initialized');
  }
}
