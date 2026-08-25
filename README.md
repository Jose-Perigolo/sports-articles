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

_Added in drill 02._

## Running

_Added in drills 04 and 06._

## Seeding

_Added in drill 03._

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
