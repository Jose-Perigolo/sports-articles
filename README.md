# Sports Articles

Fullstack test assessment — a GraphQL API and Next.js client for managing sports articles.

- `apps/backend` — TypeScript, Express, Apollo Server v4, TypeORM, Postgres
- `apps/frontend` — Next.js (Pages Router), Apollo Client, Tailwind

## Requirements

| Tool    | Version                                            |
| ------- | -------------------------------------------------- |
| Node.js | 24 (see `.nvmrc`; `engines.node` allows `>=20.19`) |
| pnpm    | 11.x                                               |
| Docker  | required for the Postgres container                |

## Setup

```bash
pnpm install

cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

docker compose up -d
```

If port 5432 is already taken on your machine (a native Postgres install, for example), set
`POSTGRES_PORT` in the root `.env` to a free port and update the port in `DATABASE_URL` in
`apps/backend/.env` to match. Nothing else changes.

## Database migrations

The schema is never synchronised automatically (`synchronize` is `false` in every environment);
every change goes through a generated migration.

```bash
pnpm --filter backend db:migrate        # apply pending migrations
pnpm --filter backend db:revert         # roll the last one back
pnpm --filter backend db:generate ./src/migrations/<Name>   # after changing an entity
```

Migrations are discovered by a glob resolved from the compiled location, so the same commands
work against `src` (via `tsx`) and against `dist` after `pnpm --filter backend build`.

## Running

_Added in drills 04 and 06._

## Seeding

```bash
pnpm --filter backend seed
```

Loads 20 sports articles. The command is idempotent: it clears the table first — including any
rows deleted through the UI, which are soft-deleted rather than removed — so running it twice
leaves 20 rows, not 40. `createdAt` is staggered six hours apart backwards from the run time, so
the newest-first ordering is stable and the two pages after the first have something to show.

Thumbnails come from `picsum.photos`, seeded by article slug, so every run produces the same
image for the same article.

## Scripts

| Command                             | Description                 |
| ----------------------------------- | --------------------------- |
| `pnpm lint`                         | ESLint across the workspace |
| `pnpm format` / `pnpm format:check` | Prettier write / check      |
| `pnpm build`                        | Build every package         |
| `pnpm typecheck`                    | Type-check every package    |
| `pnpm dev`                          | Run both apps in parallel   |

## Architecture decisions

_Added in drill 12._
