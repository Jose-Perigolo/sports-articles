# Fullstack Engineer Test Assessment v2

TypeScript, Node.js, Next.js, Apollo Server — Sports Articles service

## 1. Backend (API)

**Objective:** Create an API to manage a list of sport articles using TypeScript/Node.js (Express) and Apollo Server for the backend utilizing GraphQL and utilizing any database (excluding file) on your preference to store the data.

**Tech**
- TypeScript
- Node.js (Express)
- ApolloServer v4
- Any DB of your choice, f.i. Postgres+TypeOrm (recommended), Prisma / TypeORM

### SportsArticle Model

Fields for an article:
- `id` — string/int/UUID — primary, index
- `title` — string (required)
- `content` — string (required)
- `createdAt` — Date string (optional)
- `deletedAt` — Date string (optional)
- `imageUrl` — string — link to the image (optional)

### GraphQL Requirements

**Queries**
- `articles: [SportsArticle!]!`
- `article(id: ID!): SportsArticle`

**Mutations**
- `createArticle(input: ArticleInput!): SportsArticle!`
- `updateArticle(id: ID!, input: ArticleInput!): SportsArticle!`
- `deleteArticle(id: ID!): Boolean!`

**Validation**
- `title` required
- `content` required
- Should return readable GraphQL errors.

## 2. Frontend Requirements

- Create TypeScript/Next.js application to handle CRUD operations with articles data.
- Use Apollo Client to set up GraphQL queries and mutations.
- Create components to display, add, update, and delete articles.
- Make sure that the application validates data properly and provides error messages if the data is invalid or any query/mutation fails.
- Make sure that the UI is clean, responsive and user friendly. Any UI library is fine (MaterialUI, Antd, Tailwind, Bootstrap, etc.).

**Tech**
- Next.js
- Apollo Client
- SSR

### A. SSR Requirements

Must use Next.js SSR (`getServerSideProps` or `getStaticProps` + revalidation):

1. **Articles List Page (`/`)** — fetch first 10 articles SSR via GraphQL (improves SEO + initial render performance).
2. **Article Details Page (`/article/[id]`)** — fetch the specific article using SSR.

### C. CRUD UI

**1. List Page**
- SSR initial results
- "Create article" button
- "Edit" and "Delete" buttons for each article

**2. Create Article Page**
- Simple form (title, content)
- Validate on client (required: title + content)
- Show server errors if mutation fails

**3. Edit Article Page**
- Same form with existing values loaded via query
- Validate + submit

**4. Delete**
- Show `window.confirm`
- On success → redirect or remove from UI

## 3. Monorepo Requirements

Use pnpm workspaces.

```
/apps
  /backend
  /frontend
/packages (optional)
```

## 4. Tooling

- TypeScript
- ESLint + Prettier (basic)
- `.env.example`
- README with:
  - setup
  - running backend
  - running frontend
  - seed instructions
  - Node.js version

Docker optional (not required).

## 5. Running the project

Reviewer should be able to:

```bash
pnpm install

# Start backend
pnpm --filter backend dev

# Start frontend
pnpm --filter frontend dev
```

Frontend should show the seeded articles immediately via SSR.

## 6. Evaluation Criteria

- Can you build a working monorepo?
- Does SSR work correctly for the pages?
- Is infinite loading implemented cleanly?
- Do CRUD operations work?
- Is the GraphQL schema correct + typed?
- Is the code easy to read?
- Is the project easy to run?

## Submission

1. Provide a link to a public GitHub repository containing the source code combined in the monorepo managed by pnpm.
2. Include detailed instructions of how to run the application locally in the README file, including database migration instructions, data seed instructions and proper version of environments/runtimes the application is run in (e.g. Node.js version).
3. Ensure the application is well-documented and follows best practices for code quality and structure, including configuration of eslint, prettier, etc.
4. If you use any standalone database like Postgres or MySQL that requires installation, provide a proper Docker configuration for that (Dockerfile or docker-compose configuration).
