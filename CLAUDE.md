# Sports Articles — Fullstack Test (Speed & Function)

Full test context lives in `docs/test-brief.md` — read it before any implementation task.
Execution order lives in `docs/build-plan.md` — follow it one drill at a time.

## Stack and fixed decisions
- pnpm workspaces monorepo: `apps/backend`, `apps/frontend`.
- Backend: TypeScript, Node 24, Express + Apollo Server v4 (`@apollo/server/express4` — NOT `apollo-server-express`), TypeORM + Postgres. CommonJS output (`tsc` → CJS, `tsx` in dev) — required for decorator metadata, and it keeps `__dirname` available.
- Frontend: Next.js **Pages Router** (not App Router — the brief requires `getServerSideProps`), Apollo Client, Tailwind, react-hook-form + zod.
- ORM is **TypeORM**, following the brief's explicit `(recommended)`. Beyond the recommendation: `@DeleteDateColumn` maps exactly onto the brief's `deletedAt` field and gives soft delete plus automatic exclusion from every query for free, where Prisma would need a hand-written `deletedAt: null` at every call site. Only one deliberate deviation from the brief is worth spending — that budget goes to the `limit`/`offset` schema extension below.
- Codegen: graphql-code-generator for typed hooks on the frontend.
- Node 24 is the developed-on version (`.nvmrc`, README), but `engines.node` stays a range (`>=20.19`, the TypeORM 1.x floor) so a reviewer on 22 isn't hard blocked.
- `docker-compose.yml` (Postgres only) is required, not optional: the brief's submission checklist demands Docker config for any standalone DB. It lands in drill 01, not at the end.
- pnpm 11 gates postinstall scripts through **`allowBuilds` in `pnpm-workspace.yaml`**, not `pnpm.onlyBuiltDependencies` in package.json — the latter parses and echoes back from `pnpm config get` but does not govern, and an unlisted package hard-fails install with `ERR_PNPM_IGNORED_BUILDS` (exit 1), which also breaks `pnpm exec`. Both forms are declared so pnpm 10 and 11 each install cleanly. Drill 06 adds `sharp` and `@tailwindcss/oxide` — extend `allowBuilds` when it does, or a reviewer's cold `pnpm install` fails outright.
- `@types/node` is pinned to `^24` to match the runtime; a bare install resolves it to `^26`.
- Root ESLint + Prettier are set up in drill 01, not last — "run `pnpm lint` before a task is done" is unenforceable otherwise.

## General conventions
- Strict TypeScript (`strict: true`), no implicit `any`.
- No obvious comments in the code — only where a decision isn't self-evident.
- Don't add dependencies beyond what's needed without justifying it in the README.
- Run `pnpm lint` and `pnpm build` before considering any task done.

## Backend
- Business errors: `GraphQLError` with `extensions.code` (e.g. `BAD_USER_INPUT`), never a raw `throw new Error()`.
- Soft delete is TypeORM-native: `@DeleteDateColumn() deletedAt`, `deleteArticle` calls `repository.softDelete(id)`. Default `find`/`findOneBy` already exclude soft-deleted rows — never pass `withDeleted: true`, and never hand-roll a `deletedAt IS NULL` filter. `article(id)` on a missing or soft-deleted row returns `null` (frontend 404s).
- `src/entities/SportsArticle.ts` is the source of truth — `typeDefs` must not diverge from the entity's columns.
- `synchronize` is **always** `false`, in every environment. Schema changes go through generated migrations (`migration:generate` / `migration:run`) — the brief's submission checklist requires migration instructions, and `synchronize: true` in a submitted repo reads as a shortcut.
- TypeORM is **1.x** (`^1.1.0`), the current `latest`; `0.3.31` is npm-tagged `legacy`. The 1.x API is the 0.3 API — `DataSource`, `findOneBy`, `softDelete`, `@DeleteDateColumn` all verified present — but `createConnection` is **removed**. Most tutorials online are 0.2 and will not compile: use `new DataSource(...)` / `dataSource.initialize()` (not `createConnection`), `findOneBy({ id })` (not `findOne(id)`). A generated snippet using `createConnection` came from a stale example — rewrite it, don't adapt it. TypeORM 1.x `engines` is `^20.19 || ^22.13 || >=24.11`, so the root `engines.node` floor is `>=20.19`.
- The `DataSource` is a **single named export** (`export const dataSource`) in `src/data-source.ts` — no `export default` alongside it. TypeORM 1.x's CLI rejects a file with two DataSource exports ("must contain only one export of DataSource instance"); this is new versus 0.3.
- `uuidExtension: 'pgcrypto'` on the DataSource, so generated DDL uses `gen_random_uuid()` (core since PG 13) instead of `uuid_generate_v4()`. Without it the migration silently depends on the driver running `CREATE EXTENSION "uuid-ossp"` at connect time — which the driver only *warns* about on failure, so a locked-down Postgres would fail at migrate rather than at connect.
- Env comes from `process.loadEnvFile` in `src/env.ts` (Node >=20.12), not `dotenv` — one less dependency to justify. A missing `.env` is not an error there; `requireEnv` is what produces the actionable message.
- Deleting every row takes `repository.createQueryBuilder().delete().from(SportsArticle).execute()`. `repository.delete({})` does **not** work — TypeORM 1.x throws `Empty criteria(s) are not allowed for the delete method` (`EntityManager.js:413`) and leaves the table untouched. The query-builder form is also a hard delete, which is what the seed reset needs: a soft-deleted row would otherwise survive a re-seed and accumulate invisibly.
- Verified against TypeORM 1.1.0 on Postgres: an explicit `createdAt` **survives** both `repository.save()` and `repository.insert()`. The force-overwrite in `SubjectExecutor` is mongodb-only. The seed sets staggered timestamps directly — do not invent a raw-SQL workaround for this.
- `reflect-metadata` is imported once, first line of the entrypoint, before any entity import. `experimentalDecorators` and `emitDecoratorMetadata` on in the backend tsconfig.
- One `DataSource` per process, `initialize()` awaited before `app.listen`; the repository is handed to resolvers through the GraphQL context, never imported as a module-level global.
- `articles` takes optional `limit`/`offset` args (`articles(limit: Int, offset: Int): [SportsArticle!]!`), default sort `createdAt desc`. This deliberately extends the brief's printed schema — the evaluation criteria ask for "infinite loading implemented cleanly" but the printed schema has no pagination args, so we add the minimal ones needed rather than inventing a Relay connection type. Mention this reasoning in the README and be ready to explain it if asked.
- Dates (`createdAt`, `deletedAt`) are plain ISO strings — no custom `DateTime` scalar, matches the brief's "Date string" wording exactly.
- Schema is authored as SDL at **`apps/backend/schema.graphql`** (package root, NOT under `src/`), loaded via `readFileSync(path.join(__dirname, '../schema.graphql'))` — that path resolves the same from `src/` under tsx and from `dist/` after compile, so no copy step and no post-build breakage. A checked-in `.graphql` file is what the frontend's codegen points at — never make codegen introspect a running server (breaks a reviewer's cold `pnpm install`).
- `src/seed.ts` runs via `pnpm --filter backend seed`, is idempotent (truncate or upsert — never duplicates on a second run), and seeds **20** hand-written, realistic sports articles with staggered `createdAt` and an `imageUrl` on every row (`https://picsum.photos/seed/<slug>/800/450` — deterministic and always up). 20, not 12: page size is 10, and 12 makes the infinite-loading criterion barely observable. Do not reference or invent data from any external link not present in `docs/test-brief.md`.
- `cors()` and `express.json()` go before `expressMiddleware` — the browser calls the backend cross-origin for every mutation, and omitting CORS is the classic silent failure here.
- `articles` caps `take` at 50 regardless of the requested `limit`.
- Entity `Date` values are mapped to ISO strings on the way out; never leak `Date` objects into the GraphQL response.

## Frontend
- Pages Router only (`pages/`).
- SSR data fetching: create a fresh `ApolloClient` directly inside each page's `getServerSideProps` (no `withApollo` HOC wrapper), `client.query(...)` **wrapped in try/catch** (an unhandled throw is a 500 page, not an error state), return `initialApolloState: client.cache.extract()` as a prop, hydrate the client-side cache from it in `_app.tsx`. Same invariant as a HOC (no singleton leaking across requests), less indirection to read.
- The `InMemoryCache` declares `Query.fields.articles` with `keyArgs: false` and an offset-aware `merge` from the moment the client is created — without it `fetchMore` overwrites the list, Apollo logs a merge warning, and `cache.evict` on delete misbehaves. This is the substance of "infinite loading implemented cleanly", not the scroll sentinel.
- `article(id)` returning `null` (missing or soft-deleted) → `return { notFound: true }`, a real 404.
- If `next/image` is used, `images.remotePatterns` must include the seed image host.
- Create/edit forms include `title`, `content`, and optional `imageUrl` — the model has `imageUrl`, so user-created articles shouldn't be the only ones without a thumbnail.
- Every mutation handles loading/error state; GraphQL errors show near the form, never via `alert()`.
- Delete uses `window.confirm`; on success, remove the item from the Apollo cache (`cache.evict` + `cache.gc()`) without a full page reload.
- List page paginates via the backend's `limit`/`offset` args: SSR the first 10, then `fetchMore` (IntersectionObserver sentinel plus a "Load more" fallback) for the rest — `hasMore` is false as soon as a page returns fewer than `limit` items, no extra connection type.

## Workflow
- One task at a time; review the diff before moving to the next.
- Don't migrate to App Router, don't swap Apollo Server v4 for older versions, even if it looks simpler or shows up in older examples.
- Node 24 everywhere in prose, `.nvmrc`, README and drill instructions; the one exception is `engines.node`, which is the `>=20.19` range above. Don't let a later step drift back to Node 20 or 22 as the documented version.
- Before submitting: cold-run rehearsal — fresh clone into a temp dir, follow the README verbatim, fix whatever breaks.
- Stretch, only after the 7 scored criteria in `docs/test-brief.md` are solid and polished: a couple of backend resolver tests (validation error, soft-delete filtering) plus a minimal GitHub Action running lint+build. Not required by the brief — don't spend time here before the core deliverable is done.
