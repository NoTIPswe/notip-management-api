import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JetStreamClient } from '../../nats/jetstream.client';

@Injectable()
export class GatewaysListener {
  private readonly logger = new Logger(GatewaysListener.name);

  constructor(private readonly nats: JetStreamClient) {}

  @OnEvent('gateway.decommissioned')
  async handleGatewayDecommissioned(payload: {
    tenantId: string;
    gatewayId: string;
  }) {
    const { tenantId, gatewayId } = payload;
    try {
      const subject = `gateway.decommissioned.${tenantId}.${gatewayId}`;
      const natsPayload = {
        gatewayId,
        timestamp: new Date().toISOString(),
      };
      await this.nats.publish(
        subject,
        Buffer.from(JSON.stringify(natsPayload)),
      );
      this.logger.log(
        `Published decommissioning event for gateway ${gatewayId} to NATS on ${subject}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish decommissioning event for gateway ${gatewayId} to NATS`,
        error as Error,
      );
    }
  }
}
