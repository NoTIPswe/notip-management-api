import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JetStreamClient } from '../../nats/jetstream.client';
import { GatewaysPersistenceService } from './gateways.persistence.service';
import { GatewayStatus } from '../enums/gateway.enum';

@Injectable()
export class GatewaysNatsService implements OnModuleInit {
  private readonly logger = new Logger(GatewaysNatsService.name);

  constructor(
    private readonly nats: JetStreamClient,
    private readonly persistence: GatewaysPersistenceService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.nats.subscribeCore(
      'internal.mgmt.gateway.update-status',
      async (msg) => {
        this.logger.debug(
          `Received request on internal.mgmt.gateway.update-status`,
        );
        try {
          const payload = JSON.parse(msg.data.toString()) as {
            gateway_id: string;
            status: string;
            last_seen_at: string;
          };

          const success = await this.persistence.updateStatus(
            payload.gateway_id,
            payload.status as GatewayStatus,
            new Date(payload.last_seen_at),
          );

          msg.respond(Buffer.from(JSON.stringify({ success })));
        } catch (error) {
          this.logger.error(
            'Failed to process gateway status update',
            error as Error,
          );
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

    await this.nats.subscribeCore(
      'internal.mgmt.factory.validate',
      async (msg) => {
        try {
          const payload = JSON.parse(msg.data.toString()) as {
            factory_id: string;
            factory_key: string;
          };

          const gateway = await this.persistence.findByFactoryId(
            payload.factory_id,
          );

          if (!gateway || !gateway.factoryKeyHash || gateway.provisioned) {
            msg.respond(Buffer.from(JSON.stringify({ error: 'INVALID' })));
            return;
          }

          const isValid = await bcrypt.compare(
            payload.factory_key,
            gateway.factoryKeyHash,
          );

          if (!isValid) {
            msg.respond(Buffer.from(JSON.stringify({ error: 'INVALID' })));
            return;
          }

          msg.respond(
            Buffer.from(
              JSON.stringify({
                gateway_id: gateway.id,
                tenant_id: gateway.tenantId,
              }),
            ),
          );
        } catch (error) {
          this.logger.error('Failed to validate factory key', error as Error);
          msg.respond(
            Buffer.from(
              JSON.stringify({
                error: 'INTERNAL_ERROR',
                message: (error as Error).message,
              }),
            ),
          );
        }
      },
    );

    this.logger.log('Gateways NATS internal listeners initialized');
  }
}
