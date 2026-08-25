# Sports Articles

A GraphQL API and Next.js client for managing sports articles, built as a pnpm workspace.

- `apps/backend` — TypeScript, Express, Apollo Server v4, TypeORM, Postgres
- `apps/frontend` — Next.js (Pages Router), Apollo Client, Tailwind

## Requirements

| Tool    | Version                                                              |
| ------- | -------------------------------------------------------------------- |
| Node.js | 24 — the developed-on version (`.nvmrc`); `engines` allows `>=20.19` |
| pnpm    | 11.x (`packageManager` pins the exact version for Corepack)          |
| Docker  | required — Postgres runs in the container from `docker-compose.yml`  |

## Setup

From a fresh clone, in order:

```bash
pnpm install

cp .env.example .env                            # Postgres credentials + host port
cp apps/backend/.env.example apps/backend/.env  # DATABASE_URL, PORT
cp apps/frontend/.env.example apps/frontend/.env # NEXT_PUBLIC_GRAPHQL_URL

docker compose up -d                            # Postgres 16, waits until healthy

pnpm --filter backend db:migrate                # create the schema
pnpm --filter backend seed                      # 20 sports articles
```

Each file is read by a different process — the root `.env` by Docker Compose,
`apps/backend/.env` by the API, `apps/frontend/.env` by Next — and they fail differently.
`apps/backend/.env` is the only one strictly required for a default local run: skip it and the
API exits immediately with `Missing required environment variable DATABASE_URL`. The other two
have fallbacks that happen to match the defaults here (Compose uses `POSTGRES_PORT=5432`, the
client uses `http://localhost:4000/graphql`). Copy all three anyway — those fallbacks stop
matching the moment anything moves off its default port or host.

**Port conflicts.** The container publishes on `${POSTGRES_PORT:-5432}`. If something already
owns 5432 — a native Postgres install is the usual culprit — set `POSTGRES_PORT` in the root
`.env` to a free port and change the port in `DATABASE_URL` in `apps/backend/.env` to match.
Nothing else changes.

## Running

```bash
pnpm --filter backend dev     # http://localhost:4000/graphql
pnpm --filter frontend dev    # http://localhost:3000
```

The list page shows the seeded articles immediately, server-rendered. The API also serves
Apollo Sandbox at `/graphql` in development and a `GET /health` endpoint.

## Database migrations

`synchronize` is `false` in every environment; the schema only ever changes through a generated
migration.

```bash
pnpm --filter backend db:migrate                             # apply pending migrations
pnpm --filter backend db:revert                              # roll the last one back
pnpm --filter backend db:generate ./src/migrations/<Name>    # after changing an entity
```

Migrations are found through a glob built from `__dirname`, so the same commands work against
`src` (via `tsx`) and against `dist` after `pnpm --filter backend build`.

## Seeding

```bash
pnpm --filter backend seed
```

Loads 20 hand-written articles. Idempotent: it clears the table first — including rows deleted
through the UI, which are soft-deleted rather than removed — so a second run leaves 20 rows, not 40. `createdAt` values are staggered six hours apart going backwards, so newest-first ordering is
stable and there is more than one page to scroll. Thumbnails come from `picsum.photos` seeded by
article slug, so the same article always gets the same image.

## Scripts

| Command                             | Description                                 |
| ----------------------------------- | ------------------------------------------- |
| `pnpm dev`                          | Run both apps in parallel                   |
| `pnpm build`                        | Build every package                         |
| `pnpm lint`                         | ESLint across the workspace (warnings fail) |
| `pnpm format` / `pnpm format:check` | Prettier write / check                      |
| `pnpm typecheck`                    | Type-check every package                    |
| `pnpm --filter frontend codegen`    | Regenerate typed hooks from the SDL         |

## GraphQL API

Schema lives at `apps/backend/schema.graphql` and is the file codegen reads.

```graphql
type Query {
  articles(limit: Int, offset: Int): [SportsArticle!]!
  article(id: ID!): SportsArticle
}

type Mutation {
  createArticle(input: ArticleInput!): SportsArticle!
  updateArticle(id: ID!, input: ArticleInput!): SportsArticle!
  deleteArticle(id: ID!): Boolean!
}
```

Business errors are `GraphQLError`s with an `extensions.code`: `BAD_USER_INPUT` (validation,
carrying `extensions.field` so the client can attach the message to the right input) and
`NOT_FOUND` (updating an article that is missing or already deleted).

## Architecture decisions

- **TypeORM, per the brief's recommendation — and `@DeleteDateColumn` is what earns it.**
  `deleteArticle` calls `repository.softDelete(id)`, and every default `find`/`findOneBy`
  excludes soft-deleted rows automatically. The brief's `deletedAt` field maps onto it exactly.
  Prisma would need a hand-written `deletedAt: null` at every call site.

- **`articles` takes `limit`/`offset`, which extends the brief's printed schema.** This is the
  one deliberate deviation. The evaluation criteria ask for infinite loading, but the printed
  schema has no pagination arguments; adding the two minimal ones is a smaller change than
  inventing a Relay connection type, and offset paging is what the UI actually needs. `limit` is
  capped at 50 server-side regardless of what is requested, and ordering is
  `createdAt DESC, id DESC` so paging is total rather than merely-probably-total under ties.

- **Pages Router, not App Router**, because the brief asks for `getServerSideProps`.

- **A fresh `ApolloClient` per request inside each `getServerSideProps`**, no `withApollo` HOC.
  The cache is handed to the page as `initialApolloState` and the browser hydrates one
  long-lived client from it. Same invariant as the HOC — no client leaking across requests —
  with less indirection.

- **The `InMemoryCache` declares the `articles` pagination policy by hand** (`keyArgs: false`
  plus an offset-aware `merge`) rather than importing `offsetLimitPagination()`. It is the
  substance of "infinite loading implemented cleanly", so it should read as understood rather
  than imported. `merge` defaults the offset (`args?.offset ?? 0`) because Apollo passes
  `undefined` when the argument is absent, and `existing[undefined + i]` is `existing[NaN]`.

- **Deleting compacts the list field before evicting the entity.** `cache.evict` alone only
  makes the reference dangling: reads filter it out, but the stored array keeps the slot, so the
  next page loads at the rendered length and overwrites a live row. `cache.modify` removes the
  reference first.

- **Dates are ISO strings, not a custom scalar**, matching the brief's "Date string" wording.
  They are mapped explicitly on the way out — handing graphql-js a `Date` for a `String` field
  serialises it as a millisecond timestamp, silently.

- **`imageUrl` is restricted to `http`/`https` at the API, which is what lets the frontend's
  `images.remotePatterns` stay permissive about the host.** The two are a pair. `next/image`
  answers 400 from its optimizer for any host missing from `remotePatterns`, so a list that
  renders perfectly from the seed would break on the first article a user creates with an image
  from anywhere else — the fix is to allow any host over http(s). That is only safe because the
  backend rejects every other scheme (`javascript:`, `data:`, `ftp:`, `file:`), which a bare URL
  parse would happily accept.

- **The frontend zod schema duplicates the backend's rules rather than importing them.**
  `apps/frontend/lib/articleSchema.ts` mirrors `apps/backend/src/validation.ts` — same length
  limit, same messages, same http(s) restriction — and the server re-validates everything
  regardless, so the copy is a UX affordance, not the enforcement point. At scale this belongs
  in a `packages/shared-validation` workspace package consumed by both apps; with two consumers
  and one schema, that would buy build-order complexity for no benefit here.

- **Apollo Client 3, not 4.** The `typescript-react-apollo` codegen plugin emits
  `Apollo.useQuery` from the package root; Apollo Client 4 moved the React hooks to an
  `@apollo/client/react` subpath, so generated code would not compile against it.

- **The backend compiles with `module`/`moduleResolution: node16`.** `@apollo/server` publishes
  `./express4` only through its `exports` map, with no `typesVersions` fallback, so the
  mandated import cannot resolve under node10 resolution. Output stays CommonJS — required for
  decorator metadata, and it keeps `__dirname` available for loading `schema.graphql`.
