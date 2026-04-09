import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JetStreamClient } from '../../nats/jetstream.client';
import { KeysService } from './keys.service';

interface ProvisioningCompletePayload {
  gateway_id: string;
  key_material: string;
  key_version: number;
  send_frequency_ms: number;
}

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
          const payload = this.parseProvisioningCompletePayload(msg.data);

          await this.keysService.completeProvisioning(
            payload.gateway_id,
            payload.key_material,
            payload.key_version,
            payload.send_frequency_ms,
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

  private parseProvisioningCompletePayload(
    raw: Buffer,
  ): ProvisioningCompletePayload {
    const parsed = JSON.parse(
      raw.toString(),
    ) as Partial<ProvisioningCompletePayload>;

    if (
      typeof parsed.gateway_id !== 'string' ||
      typeof parsed.key_material !== 'string' ||
      typeof parsed.key_version !== 'number' ||
      !Number.isInteger(parsed.key_version) ||
      parsed.key_version <= 0 ||
      typeof parsed.send_frequency_ms !== 'number' ||
      !Number.isInteger(parsed.send_frequency_ms) ||
      parsed.send_frequency_ms <= 0
    ) {
      throw new Error('INVALID_PAYLOAD');
    }

    return {
      gateway_id: parsed.gateway_id,
      key_material: parsed.key_material,
      key_version: parsed.key_version,
      send_frequency_ms: parsed.send_frequency_ms,
    };
  }
}
