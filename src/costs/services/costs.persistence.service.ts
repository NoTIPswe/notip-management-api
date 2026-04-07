import { Injectable } from '@nestjs/common';
import { CostData } from '../costs-data';
import { JetStreamClient } from '../../command/nats/jetstream.client';
import { AlertsPersistenceService } from '../../alerts/services/alerts.persistence.service';
import { CommandPersistenceService } from '../../command/services/command.persistence.service';

@Injectable()
export class CostsPersistenceService {
  constructor(
    private readonly nats: JetStreamClient,
    private readonly alerts: AlertsPersistenceService,
    private readonly commands: CommandPersistenceService,
  ) {}

  async getTenantCost(tenantId: string): Promise<CostData> {
    const costRequest = JSON.stringify({ tenant_id: tenantId });
    const natsResponse = await this.nats.request(
      'internal.cost',
      Buffer.from(costRequest),
    );

    let dataSizeAtRest = 0;
    try {
      const parsed = JSON.parse(natsResponse.toString()) as {
        dataSizeAtRest?: number;
      };
      dataSizeAtRest = parsed.dataSizeAtRest ?? 0;
    } catch (e) {
      console.error('Failed to parse NATS response for cost data:', e);
    }

    const alertsCount = await this.alerts.countAlerts(tenantId);
    const commandsCount = await this.commands.countCommands(tenantId);
    const GB = 1024 * 1024 * 1024;
    const KB = 1024;

    return {
      storageGb: Number((dataSizeAtRest / GB).toFixed(4)),
      bandwidthGb: Number(
        (((alertsCount + commandsCount) * KB) / GB).toFixed(4),
      ),
    };
  }
}
