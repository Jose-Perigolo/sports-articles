# Build plan — Sports Articles (Speed & Function test)

Execution order for the implementation. One drill per agent turn; review the diff, run the
verification command, then move on. Fixed architectural decisions live in `CLAUDE.md`;
this file is only the sequence.

Verified local toolchain: Node v24.19.0, pnpm 11.23.0, Docker 27.5.1 / Compose v2.32.4, git 2.34.1.

---

## Drill 01 — Monorepo scaffold, tooling, Postgres, README skeleton

Create the pnpm workspace and *everything a later drill assumes already exists*:

- `pnpm-workspace.yaml` (`apps/*`), root `package.json` (private, `packageManager`,
  `engines.node: ">=20.11"`, scripts `lint`, `build`, `dev`), `.nvmrc` containing `24`.
- `apps/backend` and `apps/frontend` package.json shells with `dev` / `build` / `lint` /
  `typecheck` scripts (implementations may be stubs that exit 0 until the app exists).
- Shared `tsconfig.base.json` at root, `strict: true`; per-app tsconfigs extending it.
- ESLint (flat config) + Prettier at the root, shared by both apps. **Do this now, not at the
  end** — the standing rule is "run `pnpm lint` and `pnpm build` before a task is done", which
  is unenforceable if the linter only appears in the last drill.
- `docker-compose.yml` with Postgres 16 only (named volume, port 5432, healthcheck).
  The brief's submission checklist requires Docker config for any standalone DB, so this is
  mandatory, not optional — and drill 02 needs a live database anyway.
- `.gitignore` (node_modules, .next, dist, `.env`, generated codegen output is *not* ignored).
- `.env.example` at root and in each app. Backend: `DATABASE_URL`, `PORT`.
  Frontend: `NEXT_PUBLIC_GRAPHQL_URL`.
- `README.md` skeleton with the section headings only (Requirements, Setup, Running,
  Seeding, Architecture decisions, Scripts). Fill in as drills land; do not leave it to the end.

Verify: `pnpm install && pnpm lint && pnpm build` succeed on a clean checkout.

## Drill 02 — TypeORM entity + DataSource + migration

`apps/backend/src/entities/SportsArticle.ts`:

```
@Entity('sports_articles')
@Index(['deletedAt', 'createdAt'])
id            @PrimaryGeneratedColumn('uuid')
title         @Column('text')
content       @Column('text')
imageUrl      @Column('text', { nullable: true })
createdAt     @CreateDateColumn()
deletedAt     @DeleteDateColumn({ nullable: true })
```

`@DeleteDateColumn` is the whole reason the brief recommends TypeORM: `softDelete()` sets it and
every default `find` excludes those rows automatically. The composite index matches the only
access pattern (`deletedAt IS NULL` ordered by `createdAt DESC`).

`src/data-source.ts` exports a configured `DataSource` — **`synchronize: false` always**,
`migrations: ['src/migrations/*.ts']` (or `dist/...` when compiled), `entities` referenced by
class import, not a glob string (globs break after compile). tsconfig needs
`experimentalDecorators` + `emitDecoratorMetadata`; `import 'reflect-metadata'` is the first
line of every entrypoint, before any entity import.

Scripts, all pointing at `src/data-source.ts` through `tsx`:
`db:generate` (`migration:generate`), `db:migrate` (`migration:run`), `db:revert`.

Verify: `docker compose up -d && pnpm --filter backend db:generate ./src/migrations/Init &&
pnpm --filter backend db:migrate`, then confirm the table exists.

## Drill 03 — Seed

`apps/backend/src/seed.ts`, run via `pnpm --filter backend seed` (tsx). Initializes the
DataSource, seeds, destroys it.

- **20 articles**, hand-written and realistic (varied sports, plausible headlines, 2–4
  paragraphs each). 12 is too few: page size is 10, so 12 gives a second page of 2 and the
  infinite-loading criterion barely demonstrates itself. 20 gives three pages.
- Idempotent: `repository.delete({})` (or `TRUNCATE`) before insert. Running it twice must not
  duplicate. Note `delete` skips soft-delete semantics, which is what you want here.
- Every article gets `imageUrl` from a deterministic, always-up host
  (`https://picsum.photos/seed/<slug>/800/450`). Do not invent URLs from links that are not
  in `docs/test-brief.md`.
- Explicit staggered `createdAt` values going backwards, so `createdAt DESC` gives a stable,
  meaningful order rather than 20 rows sharing one timestamp.

Verify: run seed twice, `SELECT count(*)` is 20 both times.

## Drill 04 — Apollo Server v4 + Express + SDL

- SDL lives at **`apps/backend/schema.graphql`** — the package root, not `src/schema/`.
  Loaded with `readFileSync(path.join(__dirname, '../schema.graphql'), 'utf8')`, which
  resolves identically from `src/` under tsx and from `dist/` after `tsc` (both are one level
  below the package root). This removes the "readFileSync breaks after compile" trap by
  construction instead of patching it later.
- `src/server.ts`: `import 'reflect-metadata'` first, `await dataSource.initialize()` before
  `app.listen`, then Express + `expressMiddleware` from `@apollo/server/express4`, with
  `cors()` and `express.json()` **before** the middleware. CORS is required — the browser calls
  the backend on a different port for every mutation, and omitting it is the classic silent
  failure here. A `/health` route is a cheap extra.
- `src/context.ts` builds the context per request, exposing
  `dataSource.getRepository(SportsArticle)`. Resolvers take the repository from context; no
  module-level repository singleton.
- Schema mirrors the entity exactly, with `articles(limit: Int, offset: Int): [SportsArticle!]!`
  and ISO-string dates (`createdAt: String`, `deletedAt: String`).

Verify: `pnpm --filter backend dev`, hit `/graphql` with `{ articles(limit:2){ id title } }`.

## Drill 05 — Resolvers

- `articles`: `repo.find({ order: { createdAt: 'DESC' }, take: Math.min(limit ?? 10, 50),
  skip: offset ?? 0 })`. Soft-deleted rows are excluded by TypeORM automatically — do not add a
  manual filter. Cap the limit: an unbounded client-supplied `limit` is exactly the kind of
  thing that gets asked about in the interview.
- `article(id)`: `repo.findOneBy({ id })` → `null` for missing *or* soft-deleted, same code path.
- `createArticle` / `updateArticle`: validate with zod; on failure throw `GraphQLError` with
  `extensions.code = 'BAD_USER_INPUT'` and `extensions.field`, so the frontend can attach the
  message to the right input. `updateArticle` on a missing/deleted id → `NOT_FOUND`.
- `deleteArticle`: `repo.softDelete(id)`, return `result.affected === 1`. An already-deleted id
  returns `false` rather than throwing.
- Map entity `Date` → ISO string in the field resolvers (or a small mapper); never leak `Date`
  objects into the response.

Verify: exercise each operation in Apollo Sandbox, including a validation failure, then confirm
a deleted article disappears from `articles` and returns `null` from `article(id)` while its row
still exists in Postgres with `deletedAt` set.

## Drill 06 — Frontend scaffold + Apollo Client

Next.js **Pages Router** (`create-next-app --no-app`, or delete `app/`), TypeScript, Tailwind.

`lib/apolloClient.ts`:
- `createApolloClient()` — new `ApolloClient` per call, `uri` from `NEXT_PUBLIC_GRAPHQL_URL`,
  `ssrMode: typeof window === 'undefined'`.
- The `InMemoryCache` **must** declare the pagination policy up front:
  `Query.fields.articles = { keyArgs: false, merge(existing = [], incoming, { args }) { ... } }`
  merging at `args.offset`. This is the actual hard part of "infinite loading implemented
  cleanly" — without it `fetchMore` overwrites the list and Apollo logs a merge warning,
  and `cache.evict` on delete behaves unpredictably. Do not defer it to the list drill.
- A browser-side singleton for client navigation, hydrated from `pageProps.initialApolloState`
  in `_app.tsx`; a fresh instance every time on the server. No `withApollo` HOC.

Verify: `pnpm --filter frontend dev` renders a placeholder page, `pnpm lint`/`build` clean.

## Drill 07 — GraphQL operations + codegen

- `apps/frontend/graphql/operations/*.graphql` — all of them in one go:
  `Articles`, `Article`, `CreateArticle`, `UpdateArticle`, `DeleteArticle`, plus an
  `ArticleFields` fragment.
- `codegen.ts` points `schema` at `../backend/schema.graphql` (the checked-in file — never at
  a running server; a reviewer doing a cold `pnpm install` has nothing listening on :4000).
- `typescript`, `typescript-operations`, `typescript-react-apollo` (with `withHooks`, so pages
  get both `XDocument` for `client.query` in SSR and `useX` hooks on the client).
- `codegen` script wired as `prebuild` on the frontend; generated output committed.

Verify: `pnpm --filter frontend codegen && pnpm --filter frontend build`.

## Drill 08 — List page (SSR + infinite loading)

`pages/index.tsx`:
- `getServerSideProps` builds a fresh client, `client.query({ query: ArticlesDocument,
  variables: { limit: 10, offset: 0 } })` inside a **try/catch** — an unhandled throw here is a
  500 page, not an error state — and returns `initialApolloState: client.cache.extract()`.
- Client renders from `useQuery` with the same variables (cache hit, no refetch), then
  `fetchMore({ variables: { offset: data.articles.length } })` on an IntersectionObserver
  sentinel, with a "Load more" button fallback.
- `hasMore` = last page returned exactly `limit` items; stop when a page comes back short.
- Responsive Tailwind card grid: `imageUrl` thumbnail, title, `createdAt`, content excerpt,
  Edit / Delete actions, "Create article" button.
- If using `next/image`, add `images.remotePatterns` for the seed image host to
  `next.config.js` — otherwise every thumbnail 500s.

Verify: JS disabled → 10 articles in the HTML source. JS on → scroll loads 20 total, no
duplicates, no Apollo merge warnings in the console.

## Drill 09 — Detail page

`pages/article/[id].tsx`, SSR via `ArticleDocument`. `null` result (missing *or* soft-deleted)
→ `return { notFound: true }` so it's a real 404 rather than a soft empty state. Back link,
Edit / Delete actions, full content, hero image.

## Drill 10 — Create / Edit forms

`pages/article/new.tsx` and `pages/article/[id]/edit.tsx` over a shared
`components/ArticleForm.tsx`: react-hook-form + zodResolver, fields `title`, `content`,
optional `imageUrl` (validated as a URL when non-empty). Edit page loads current values via
SSR + `useQuery`. Mutations handle `loading` (disabled submit) and `error`; a
`BAD_USER_INPUT` error carrying `extensions.field` maps onto that field via `setError`,
anything else renders in a form-level alert. Never `alert()`. Redirect to the detail page on
success. The zod schema is shared in shape with the backend's — same rules both sides.

## Drill 11 — Delete + UX polish

`window.confirm`, then `deleteArticle`, then `cache.evict({ id: cache.identify(article) })`
+ `cache.gc()` — no `router.reload()`. From the detail page, redirect to `/` instead.
Then a pass over: loading skeletons, empty state, error boundaries on the list, focus states,
mobile layout at 375px.

## Drill 12 — README, final verification, publish

README: Node 24 (Active LTS; `engines` stays a `>=20.11` range so a reviewer on 22 isn't hard
blocked), pnpm, Docker; `docker compose up -d` → `pnpm install` → `pnpm --filter backend db:migrate`
→ `pnpm --filter backend seed` → the two `dev` commands exactly as the brief prints them;
`.env.example` copy step; scripts table; and an **Architecture decisions** section covering
TypeORM (per the brief's recommendation) with `@DeleteDateColumn` for soft delete, Pages Router, the `limit`/`offset` extension to the printed schema and
why not a Relay connection, ISO strings over a custom scalar, and the per-request SSR client.

Then a cold-run rehearsal: fresh clone into a temp dir, follow the README verbatim, no prior
knowledge. Fix whatever breaks. Then `git init`, commit, push public.

## Drill 13 — Stretch (only if drills 01–12 are polished)

Vitest on two backend resolvers (validation → `BAD_USER_INPUT`; soft-deleted row excluded from
`articles` and `article`), plus a GitHub Action running `pnpm install && pnpm lint && pnpm build`.
Skip Playwright.
