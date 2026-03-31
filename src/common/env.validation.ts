import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provisioning = 'provisioning',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsNumber()
  @IsOptional()
  MGMT_API_PORT: number;

  @IsString()
  MGMT_DB_HOST: string;

  @IsNumber()
  MGMT_DB_PORT: number;

  @IsString()
  MGMT_DB_USER: string;

  @IsString()
  MGMT_DB_PASSWORD: string;

  @IsString()
  MGMT_DB_NAME: string;

  @IsUrl({ require_tld: false })
  KEYCLOAK_URL: string;

  @IsString()
  KEYCLOAK_REALM: string;

  @IsString()
  KEYCLOAK_MGMT_CLIENT_ID: string;

  @IsString()
  KEYCLOAK_MGMT_CLIENT_SECRET: string;

  @IsString()
  DB_ENCRYPTION_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
