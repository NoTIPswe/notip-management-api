import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JetStreamClient } from '../../nats/jetstream.client';
import { AlertsPersistenceService } from './alerts.persistence.service';
import { AlertType } from '../enums/alerts.enum';

interface GatewayOfflinePayload {
  tenantId?: string;
  gatewayId: string;
  lastSeen: string;
  timeoutMs: number;
  timestamp: string;
}

@Injectable()
export class AlertsNatsService implements OnModuleInit {
  private readonly logger = new Logger(AlertsNatsService.name);

  constructor(
    private readonly nats: JetStreamClient,
    private readonly persistence: AlertsPersistenceService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Core NATS R-R for alert configs
    await this.nats.subscribeCore(
      'internal.mgmt.alert-configs.list',
      async (msg) => {
        try {
          const configs = await this.persistence.findAllAlertsConfigs();
          const response = configs.map((c) => ({
            tenant_id: c.tenantId,
            gateway_id: c.gatewayId,
            timeout_ms: c.gatewayTimeoutMs,
          }));

          msg.respond(Buffer.from(JSON.stringify(response)));
        } catch (error) {
          this.logger.error('Failed to list alert configs', error as Error);
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

    // JetStream for gateway offline alerts
    // Subject: alert.{tenantId}.gw_offline
    await this.nats.subscribe('alert.*.gw_offline', async (msg) => {
      try {
        const payload = JSON.parse(
          msg.data.toString(),
        ) as GatewayOfflinePayload;
        // subject is alert.<tenantId>.gw_offline
        const subjectParts = msg.subject.split('.');
        const tenantId = payload.tenantId || subjectParts[1];

        if (!tenantId) {
          this.logger.warn(
            `Could not determine tenantId for alert on subject ${msg.subject}`,
          );
          return;
        }

        await this.persistence.saveAlert({
          tenantId: tenantId,
          gatewayId: payload.gatewayId,
          type: AlertType.GATEWAY_OFFLINE,
          details: {
            lastSeen: new Date(payload.lastSeen),
            timeoutConfigured: payload.timeoutMs,
            timestamp: payload.timestamp,
          },
        });

        await Promise.resolve(msg.ack());
      } catch (error) {
        this.logger.error(
          'Failed to process gateway offline alert',
          error as Error,
        );
      }
    });

    this.logger.log('Alerts NATS internal listeners initialized');
  }
}
