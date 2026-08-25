import 'reflect-metadata';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { SportsArticle } from './entities/SportsArticle';
import { requireEnv } from './env';

export const dataSource = new DataSource({
  type: 'postgres',
  url: requireEnv('DATABASE_URL'),
  // Emits gen_random_uuid() for the uuid primary key — core Postgres since 13, so the
  // migration does not depend on the driver installing uuid-ossp at connect time.
  uuidExtension: 'pgcrypto',
  // Never true, in any environment: schema changes go through generated migrations.
  synchronize: false,
  logging: ['error', 'warn'],
  entities: [SportsArticle],
  // Resolves to src/migrations/*.ts under tsx and dist/migrations/*.js after tsc,
  // because both directories sit one level below the package root.
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
});
