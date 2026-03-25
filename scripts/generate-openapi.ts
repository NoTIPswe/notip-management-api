import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as yaml from 'js-yaml';

import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { GatewaysController as AdminGatewaysController } from '../src/admin/gateways/controller/gateways.controller';
import { GatewaysService as AdminGatewaysService } from '../src/admin/gateways/services/gateways.service';
import { TenantsController } from '../src/admin/tenants/controller/tenants.controller';
import { TenantsService } from '../src/admin/tenants/services/tenants.service';
import { AlertsController } from '../src/alerts/controller/alerts.controller';
import { AlertsService } from '../src/alerts/services/alerts.service';
import { ApiClientController } from '../src/api-client/controller/api-client.controller';
import { ApiClientService } from '../src/api-client/services/api-client.service';
import { AuditLogController } from '../src/audit-log/controller/audit.controller';
import { AuditLogService } from '../src/audit-log/services/audit.service';
import { AuthController } from '../src/auth/controller/auth.controller';
import { ImpersonationService } from '../src/auth/services/impersonation.service';
import { CommandController } from '../src/command/controller/command.controller';
import { CommandService } from '../src/command/services/command.service';
import { CostsController } from '../src/costs/controller/costs.controller';
import { CostsService } from '../src/costs/services/costs.service';
import { GatewaysController } from '../src/gateways/controller/gateways.controller';
import { GatewaysService } from '../src/gateways/services/gateways.service';
import { KeysController } from '../src/keys/controller/keys.controller';
import { KeysService } from '../src/keys/services/keys.service';
import { ThresholdsController } from '../src/thresholds/controller/thresholds.controller';
import { ThresholdsService } from '../src/thresholds/services/thresholds.service';
import { UsersController } from '../src/users/controller/users.controller';
import { UsersService } from '../src/users/services/users.service';

const OUTPUT_DIR = 'api-contracts/openapi';
const OUTPUT_FILE = `${OUTPUT_DIR}/openapi.yaml`;

async function generateOpenApi(): Promise<void> {
  const moduleRef = await Test.createTestingModule({
    controllers: [
      AppController,
      AdminGatewaysController,
      TenantsController,
      AlertsController,
      ApiClientController,
      AuditLogController,
      AuthController,
      CommandController,
      CostsController,
      GatewaysController,
      KeysController,
      ThresholdsController,
      UsersController,
    ],
    providers: [
      { provide: AppService, useValue: {} },
      { provide: AdminGatewaysService, useValue: {} },
      { provide: TenantsService, useValue: {} },
      { provide: AlertsService, useValue: {} },
      { provide: ApiClientService, useValue: {} },
      { provide: AuditLogService, useValue: {} },
      { provide: ImpersonationService, useValue: {} },
      { provide: CommandService, useValue: {} },
      { provide: CostsService, useValue: {} },
      { provide: GatewaysService, useValue: {} },
      { provide: KeysService, useValue: {} },
      { provide: ThresholdsService, useValue: {} },
      { provide: UsersService, useValue: {} },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('NoTIP Management API')
    .setDescription('NoTIP Management API OpenAPI specification')
    .setVersion(process.env.npm_package_version ?? '1.2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const yamlString = yaml.dump(document, { noRefs: true });

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, yamlString, 'utf8');

  await app.close();
  console.log(`OpenAPI spec successfully written to ${OUTPUT_FILE}`);
}

generateOpenApi()
  .then(() => {
    console.log('Processo terminato con successo.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to generate OpenAPI spec:', err);
    process.exit(1);
  });
