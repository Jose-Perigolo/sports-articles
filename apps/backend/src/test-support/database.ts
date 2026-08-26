import 'reflect-metadata';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { SportsArticle } from '../entities/SportsArticle';
import { requireEnv } from '../env';
import { Init1787653372235 } from '../migrations/1787653372235-Init';

/**
 * Listed explicitly rather than globbed like the runtime DataSource does. A glob makes TypeORM
 * require() the raw .ts file at runtime, outside vitest's transform, which fails with
 * "Cannot use import statement outside a module". New migrations must be added here; the
 * suite fails loudly against a stale schema rather than passing quietly.
 */
const MIGRATIONS = [Init1787653372235];

/**
 * CI points TEST_DATABASE_URL at its throwaway service database. Locally we derive a
 * `<database>_test` sibling instead, so running the suite never wipes the seeded rows a
 * reviewer is looking at in the browser.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) return explicit;

  const url = new URL(requireEnv('DATABASE_URL'));
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

export async function ensureTestDatabase(url: string): Promise<void> {
  const target = new URL(url);
  const databaseName = decodeURIComponent(target.pathname.slice(1));

  const admin = new URL(url);
  admin.pathname = '/postgres';

  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const existing = await client.query('select 1 from pg_database where datname = $1', [
      databaseName,
    ]);
    if (existing.rowCount === 0) {
      await client.query(`create database "${databaseName.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

export function createTestDataSource(url: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url,
    synchronize: false,
    logging: false,
    uuidExtension: 'pgcrypto',
    entities: [SportsArticle],
    migrations: MIGRATIONS,
  });
}
