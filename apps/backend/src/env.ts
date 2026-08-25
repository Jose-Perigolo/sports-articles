import path from 'node:path';

let loaded = false;

/**
 * Node's own .env reader (>=20.12), so the project needs no dotenv dependency.
 * Absent file is not an error: in CI and in Docker the variables come from the
 * environment itself.
 */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  try {
    process.loadEnvFile(path.join(__dirname, '../.env'));
  } catch {
    // no .env on disk — fall through to the ambient environment
  }
}

export function requireEnv(name: string): string {
  loadEnv();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env.`);
  }
  return value;
}
