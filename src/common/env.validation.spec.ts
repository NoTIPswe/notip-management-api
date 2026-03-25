import 'reflect-metadata';
import { validate } from './env.validation';

describe('env.validation', () => {
  it('throws error when validation fails', () => {
    const config = {};
    expect(() => validate(config)).toThrow();
  });

  it('returns validated config when successful', () => {
    const config = {
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USER: 'user',
      DB_PASSWORD: 'password',
      DB_NAME: 'test',
      KEYCLOAK_URL: 'http://localhost:8080',
      KEYCLOAK_REALM: 'notip',
      KEYCLOAK_MGMT_CLIENT_ID: 'client',
      KEYCLOAK_MGMT_CLIENT_SECRET: 'secret',
    };
    const result = validate(config);
    expect(result.DB_HOST).toBe('localhost');
    expect(result.DB_PORT).toBe(5432);
  });
});
