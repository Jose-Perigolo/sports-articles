import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import express from 'express';
import { createContext, GraphQLContext } from './context';
import { dataSource } from './data-source';
import { loadEnv } from './env';
import { resolvers } from './resolvers';

// One level below the package root under both tsx (src/) and tsc (dist/), so the SDL is
// found without a build copy step.
const typeDefs = readFileSync(path.join(__dirname, '../schema.graphql'), 'utf8');

function redactCredentials(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

async function connect(): Promise<void> {
  try {
    await dataSource.initialize();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      [
        `Could not connect to Postgres at ${redactCredentials(process.env.DATABASE_URL ?? '(unset)')}`,
        `  ${reason}`,
        '',
        'Start the database and apply the schema:',
        '  docker compose up -d',
        '  pnpm --filter backend db:migrate',
        '  pnpm --filter backend seed',
        '',
        'If the port is already taken, set POSTGRES_PORT in .env and update DATABASE_URL in',
        'apps/backend/.env to match.',
      ].join('\n'),
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  loadEnv();
  await connect();

  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // cors() and express.json() must precede the middleware: the browser posts every mutation
  // cross-origin, and expressMiddleware does not parse bodies itself.
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, { context: createContext }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  console.log(`GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
