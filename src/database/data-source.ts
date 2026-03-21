import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';

const port = Number(process.env.DB_PORT);

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.isNaN(port) ? 5432 : port,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [
    join(__dirname, '..', 'migrations', '*.ts'),
    join(__dirname, '..', 'migrations', '*.js'),
  ],
});
