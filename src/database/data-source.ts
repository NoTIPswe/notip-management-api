import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { resolve } from 'node:path';

const port = Number(process.env.MGMT_DB_PORT);
const databasePort = Number.isNaN(port) ? 5432 : port;
const connectionTimeoutMs = Number(process.env.MGMT_DB_CONNECT_TIMEOUT_MS);
const srcRoot = resolve(__dirname, '..');
const migrationsDir = resolve(srcRoot, 'migrations');

const appDataSource = new DataSource({
  type: 'postgres',
  host: process.env.MGMT_DB_HOST ?? 'localhost',
  port: databasePort,
  username: process.env.MGMT_DB_USER ?? 'postgres',
  password: process.env.MGMT_DB_PASSWORD ?? 'postgres',
  database: process.env.MGMT_DB_NAME ?? 'postgres',
  extra: {
    connectionTimeoutMillis: Number.isNaN(connectionTimeoutMs)
      ? 5000
      : connectionTimeoutMs,
  },
  entities: [resolve(srcRoot, '**', '*.entity.{ts,js}')],
  migrations: [resolve(migrationsDir, '*.ts'), resolve(migrationsDir, '*.js')],
});

export default appDataSource;
