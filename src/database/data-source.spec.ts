import { DataSource } from 'typeorm';

describe('data-source', () => {
  const originalEnv = process.env;

  const loadDataSource = (): DataSource => {
    let dataSource: DataSource | undefined;

    jest.isolateModules(() => {
      const dataSourceModule = jest.requireActual<{ default: DataSource }>(
        './data-source',
      );
      dataSource = dataSourceModule.default;
    });

    if (!dataSource) {
      throw new Error('Failed to load data source');
    }

    return dataSource;
  };

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('builds the datasource from environment variables', () => {
    process.env = {
      ...originalEnv,
      MGMT_DB_HOST: 'db-host',
      MGMT_DB_PORT: '6543',
      MGMT_DB_USER: 'db-user',
      MGMT_DB_PASSWORD: 'db-password',
      MGMT_DB_NAME: 'db-name',
      MGMT_DB_CONNECT_TIMEOUT_MS: '7000',
    };

    const dataSource = loadDataSource();

    expect(dataSource.options).toEqual(
      expect.objectContaining({
        type: 'postgres',
        host: 'db-host',
        port: 6543,
        username: 'db-user',
        password: 'db-password',
        database: 'db-name',
        extra: { connectionTimeoutMillis: 7000 },
      }),
    );
    expect(dataSource.options.entities).toEqual(
      expect.arrayContaining([expect.stringContaining('*.entity.{ts,js}')]),
    );
    expect(dataSource.options.migrations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('migrations'),
        expect.stringContaining('*.ts'),
      ]),
    );
  });

  it('falls back to default connection settings when env vars are invalid', () => {
    process.env = {
      ...originalEnv,
      MGMT_DB_PORT: 'not-a-number',
      MGMT_DB_CONNECT_TIMEOUT_MS: 'bad',
    };

    const dataSource = loadDataSource();

    expect(dataSource.options).toEqual(
      expect.objectContaining({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'postgres',
        extra: { connectionTimeoutMillis: 5000 },
      }),
    );
  });
});
