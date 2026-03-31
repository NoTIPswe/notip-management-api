import 'reflect-metadata';
import { validate } from './env.validation';

describe('env.validation', () => {
  it('throws error when validation fails', () => {
    const config = {};
    expect(() => validate(config)).toThrow();
  });

  it('returns validated config when successful', () => {
    const config = {
      MGMT_DB_HOST: 'localhost',
      MGMT_DB_PORT: 5432,
      MGMT_DB_USER: 'user',
      MGMT_DB_PASSWORD: 'password',
      MGMT_DB_NAME: 'test',
      KEYCLOAK_URL: 'http://localhost:8080',
      KEYCLOAK_REALM: 'notip',
      KEYCLOAK_MGMT_CLIENT_ID: 'client',
      KEYCLOAK_MGMT_CLIENT_SECRET: 'secret',
      DB_ENCRYPTION_KEY: '12345678901234567890123456789012',
    };
    const result = validate(config);
    expect(result.MGMT_DB_HOST).toBe('localhost');
    expect(result.MGMT_DB_PORT).toBe(5432);
  });
});
