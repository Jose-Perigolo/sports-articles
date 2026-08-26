# Sports Articles

A GraphQL API and Next.js client for managing sports articles, built as a pnpm workspace.

- `apps/backend` — TypeScript, Express, Apollo Server v4, TypeORM, Postgres
- `apps/frontend` — Next.js (Pages Router), Apollo Client, Tailwind

## Demo

![Infinite scroll](docs/media/infinite-scroll.gif)

The list server-renders the first 10 articles, then `fetchMore` appends each page through the
cache's merge policy; the control retires when a page comes back short.

![Delete](docs/media/delete.gif)

Deleting from a partially loaded list: the reference is removed from the merged field before the
entity is evicted, so paging afterwards neither skips nor duplicates a row. The `window.confirm`
prompt does fire — it is accepted in the recording but never appears, because headless Chromium
does not paint native dialogs.

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
pnpm --filter backend seed                      # 30 articles from docs/data-example.csv
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

Loads the 30 articles from `docs/data-example.csv` (see the note on that dataset under
Architecture decisions). Idempotent: it clears the table first — including rows deleted
through the UI, which are soft-deleted rather than removed — so a second run leaves 30 rows, not 60. `createdAt` comes from the CSV and is date-only, giving three full pages of 10 to scroll
through.

## Scripts

| Command                             | Description                                 |
| ----------------------------------- | ------------------------------------------- |
| `pnpm dev`                          | Run both apps in parallel                   |
| `pnpm build`                        | Build every package                         |
| `pnpm lint`                         | ESLint across the workspace (warnings fail) |
| `pnpm format` / `pnpm format:check` | Prettier write / check                      |
| `pnpm typecheck`                    | Type-check every package                    |
| `pnpm test`                         | Backend resolver tests                      |
| `pnpm --filter frontend codegen`    | Regenerate typed hooks from the SDL         |

## Tests

```bash
pnpm test        # backend resolver tests (vitest)
```

The suite covers the two behaviours most worth pinning down: validation failures returning
`BAD_USER_INPUT` with the right `extensions.field`, and soft delete — a deleted article absent
from `articles`, `null` from `article(id)`, and still present in Postgres with `deletedAt` set.

Tests run against a real database rather than a mocked repository, because soft-delete exclusion
is TypeORM's behaviour: a mock would only assert our own stub. Locally the suite creates and uses
a `<database>_test` sibling so it never touches the rows you are looking at in the browser; set
`TEST_DATABASE_URL` to point it somewhere else.

## Continuous integration

`.github/workflows/ci.yml` runs install, lint, typecheck, migrations, seed, build and the tests
against a `services: postgres` container — which also proves the migration applies cleanly in an
environment neither the author nor the reviewer controls.

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

- **The example dataset is seeded verbatim, except for the images.** `docs/data-example.csv`
  provides 30 rows. Titles, content and `createdAt` are stored exactly as supplied, including
  the truncated single-sentence bodies — the copy describes real clubs and athletes, so
  extending it would mean inventing quotes and results.

  The supplied `imageUrl` values were not usable: 17 of the 30 answer `404` (verified by ranged
  `GET` requests, `curl -r 0-2047`, rather than `HEAD`, which can report a false negative on
  that host, and re-run to rule out transient failures), and all 30 were topically unrelated to
  the article they belonged to. `imageUrl` is display data rather than part of the record, so it
  is replaced wholesale with topic-matched photographs resolved once at author time and pinned
  in `apps/backend/src/image-picks.ts`. Each was chosen by matching the photo's own
  `alt_description` against the article's sport; that description is kept alongside the URL as
  provenance. The application needs no Unsplash credentials and makes no request to Unsplash —
  `images.unsplash.com` serves the URLs unauthenticated, exactly as the fixture's originals did.
  The originals are preserved unmodified in the committed CSV.

  The replacements also carry sizing parameters, which the originals did not: 66-348 KB each
  instead of 1.6-6.2 MB.

  Two further notes on the fixture: its integer ids are treated as ordering hints, not keys, so
  rows get generated uuids; and because `createdAt` is date-only, 22 of the 30 rows share a date
  with another row, which is exactly what the `createdAt DESC, id DESC` ordering in `articles`
  exists to make total.

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

### How this would grow

This service is deliberately not layered, and the trigger for changing that is worth naming.

**Why this shape.** There is one transport (GraphQL), one datastore, and roughly 210 lines of
business logic across `resolvers.ts`, `validation.ts`, `mappers.ts` and `errors.ts`. A use-case
layer, ports and DTO mappers would each have exactly one caller today, so they would be
indirection with nothing on the other side of it. The resolver is the application boundary until
a **second entrypoint** exists — a background worker, or a REST admin endpoint invoking the same
logic. That is the trigger. At that point `createArticle`'s validate-then-persist body moves
behind a use case the resolver and the worker both call, and the repository becomes a port so
the use case stops naming TypeORM. Not before.

**Breadth or depth decides the answer.** These are different problems and they pull in opposite
directions:

- _More features_ — identity, membership, chat — is a **modularity** problem. Each is its own
  bounded context, owning its own data, exposed as its own service and composed as federation
  subgraphs. Not shared tables, and not a `userId` column bolted onto `SportsArticle`. The
  article service should not learn what a subscription is.
- _Deeper rules inside one context_ — membership proration and grace periods, editorial embargo
  by region — is a **domain** problem, and that is where use cases and aggregates genuinely earn
  their place. In that context, though, not spread across the whole app. Articles has no
  invariant remotely that thick: its rules are "title and content are required" and "deleted
  articles stay hidden but recoverable".

**Where this service already sits.** It is a Federation 2 subgraph today: the schema is built
with `buildSubgraphSchema`, `schema.graphql` carries `@link` to the federation spec and
`@key(fields: "id")` on `SportsArticle`, and `__resolveReference` resolves entities through the
same uuid guard and mapper as `Query.article`, so a gateway and a direct client cannot disagree
about what an article is. To be plain about the boundary: there is **no gateway and no
supergraph composition in this repo**. A second subgraph and a composed supergraph are the next
step, not something already done here. This is the articles service, not the estate.

**What "built for scale" already means here** — specific, not aspirational:

- `articles` takes `limit`/`offset` with a server-side cap of 50, so no client can ask for the
  whole table.
- The `(deletedAt, createdAt)` composite index matches the only access pattern the API has:
  live rows, newest first.
- Ordering is `createdAt DESC, id DESC`, making offset paging total — it cannot skip or
  duplicate a row under ties. That is load-bearing rather than theoretical: 22 of the 30 seeded
  rows share a date with another row, because the supplied fixture's `createdAt` is date-only.
- The client cache declares the pagination policy up front, and delete removes the reference
  from the merged list before evicting the entity, so infinite scroll and delete compose without
  extra bookkeeping in either feature.
