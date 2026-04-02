import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiClientModel } from '../models/api-client.model';
import { ApiClientPersistenceService } from './api-client.persistence.service';
import { ApiClientMapper } from '../api-client.mapper';

import { KeycloakAdminService } from '../../admin/tenants/services/keycloak-admin.service';

@Injectable()
export class ApiClientService {
  private readonly logger = new Logger(ApiClientService.name);

  constructor(
    private readonly acps: ApiClientPersistenceService,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}

  async createApiClient(
    tenantId: string,
    name: string,
  ): Promise<{ model: ApiClientModel; clientSecret: string }> {
    this.logger.log(`Creating API client '${name}' for tenant ${tenantId}`);

    const existing = await this.acps.findByName(tenantId, name);
    if (existing) {
      throw new ConflictException(
        `API client with name ${name} already exists`,
      );
    }

    const { clientId, clientSecret, keycloakUuid } =
      await this.keycloakAdminService.createApiClient(name, tenantId);

    try {
      const newApiClient = await this.acps.createApiClient(
        keycloakUuid,
        tenantId,
        name,
        clientId,
      );

      return {
        model: ApiClientMapper.toModel(newApiClient),
        clientSecret,
      };
    } catch (error) {
      this.logger.error(
        `Failed to save API client ${name} to DB, rolling back Keycloak...`,
      );
      try {
        await this.keycloakAdminService.deleteApiClient(keycloakUuid);
      } catch (rollbackError) {
        const errorMsg =
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError);
        this.logger.error(
          `Critical: Failed to rollback Keycloak client ${keycloakUuid}: ${errorMsg}`,
        );
      }
      throw error;
    }
  }

  async getApiClients(tenantId: string): Promise<ApiClientModel[]> {
    const apiClients = await this.acps.getApiClients(tenantId);
    return apiClients.map((apiClient) => ApiClientMapper.toModel(apiClient));
  }

  async deleteApiClient(tenantId: string, id: string): Promise<void> {
    this.logger.log(`Deleting API client ${id} for tenant ${tenantId}`);
    const keycloakUuid = await this.acps.deleteApiClient(tenantId, id);
    if (!keycloakUuid) {
      throw new NotFoundException(`API Client with id ${id} not found`);
    }

    try {
      await this.keycloakAdminService.deleteApiClient(keycloakUuid);
    } catch (e) {
      this.logger.warn(
        `Failed to delete client ${keycloakUuid} from Keycloak, ignoring...`,
      );
      void e;
    }
  }

  async deleteApiClientsForTenant(tenantId: string): Promise<void> {
    this.logger.log(`Deleting all API clients for tenant ${tenantId}`);
    const apiClients = await this.acps.getApiClients(tenantId);
    await Promise.all(
      apiClients.map(async (apiClient) => {
        try {
          await this.deleteApiClient(tenantId, apiClient.id);
        } catch (e) {
          this.logger.warn(
            `Failed to delete API client ${apiClient.id} for tenant ${tenantId}, continuing...`,
          );
          void e;
        }
      }),
    );
  }
}
