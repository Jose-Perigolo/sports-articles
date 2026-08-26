import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { parse } from 'graphql';
import type { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { GraphQLContext } from './context';
import { SportsArticle } from './entities/SportsArticle';
import { resolvers } from './resolvers';
import { createTestDataSource, ensureTestDatabase, testDatabaseUrl } from './test-support/database';

const typeDefs = readFileSync(path.join(__dirname, '..', 'schema.graphql'), 'utf8');
// Built the same way as src/server.ts: a plain ApolloServer would reject the schema's
// federation directives, and the tests should exercise the schema the service actually serves.
const server = new ApolloServer<GraphQLContext>({
  schema: buildSubgraphSchema([{ typeDefs: parse(typeDefs), resolvers }]),
});

let dataSource: DataSource;

async function execute(query: string, variables?: Record<string, unknown>) {
  const response = await server.executeOperation(
    { query, variables },
    { contextValue: { articles: dataSource.getRepository(SportsArticle) } },
  );

  if (response.body.kind !== 'single') throw new Error('expected a single result');
  return response.body.singleResult;
}

const CREATE = `
  mutation Create($input: ArticleInput!) {
    createArticle(input: $input) { id title content imageUrl }
  }
`;

async function createArticle(title: string, content = 'Body text.') {
  const result = await execute(CREATE, { input: { title, content } });
  expect(result.errors).toBeUndefined();
  return (result.data as { createArticle: { id: string } }).createArticle;
}

beforeAll(async () => {
  const url = testDatabaseUrl();
  await ensureTestDatabase(url);
  dataSource = createTestDataSource(url);
  await dataSource.initialize();
  await dataSource.runMigrations();
});

beforeEach(async () => {
  await dataSource.getRepository(SportsArticle).createQueryBuilder().delete().execute();
});

afterAll(async () => {
  await server.stop();
  if (dataSource?.isInitialized) await dataSource.destroy();
});

describe('validation', () => {
  it.each([
    ['a blank title', { title: '   ', content: 'Body.' }, 'title', 'Title is required'],
    ['blank content', { title: 'Title', content: '  ' }, 'content', 'Content is required'],
    [
      'a non-http image url',
      { title: 'Title', content: 'Body.', imageUrl: 'javascript:alert(1)' },
      'imageUrl',
      'Image URL must start with http:// or https://',
    ],
  ])('rejects %s with BAD_USER_INPUT on the right field', async (_label, input, field, message) => {
    const result = await execute(CREATE, { input });

    expect(result.data?.createArticle).toBeFalsy();
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
    expect(result.errors?.[0].extensions?.field).toBe(field);
    expect(result.errors?.[0].message).toBe(message);
  });

  it('writes nothing when validation fails', async () => {
    await execute(CREATE, { input: { title: '', content: '' } });
    expect(await dataSource.getRepository(SportsArticle).count()).toBe(0);
  });

  it('trims accepted input and stores an empty image url as null', async () => {
    const result = await execute(CREATE, {
      input: { title: '  Spaced  ', content: '  Body.  ', imageUrl: '' },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createArticle).toMatchObject({
      title: 'Spaced',
      content: 'Body.',
      imageUrl: null,
    });
  });
});

describe('soft delete', () => {
  it('hides the row from articles and article(id) while keeping it in Postgres', async () => {
    const kept = await createArticle('Still here');
    const doomed = await createArticle('On the way out');

    const deletion = await execute(`mutation Delete($id: ID!) { deleteArticle(id: $id) }`, {
      id: doomed.id,
    });
    expect(deletion.data?.deleteArticle).toBe(true);

    const list = await execute(`query { articles(limit: 50) { id } }`);
    const ids = (list.data as { articles: { id: string }[] }).articles.map((a) => a.id);
    expect(ids).toEqual([kept.id]);

    const single = await execute(`query One($id: ID!) { article(id: $id) { id } }`, {
      id: doomed.id,
    });
    expect(single.errors).toBeUndefined();
    expect(single.data?.article).toBeNull();

    // The row is still there — deleted, not removed.
    const raw = await dataSource.query<{ deletedAt: Date | null }[]>(
      'select "deletedAt" from sports_articles where id = $1',
      [doomed.id],
    );
    expect(raw).toHaveLength(1);
    expect(raw[0].deletedAt).toBeInstanceOf(Date);

    // And the repository agrees only when explicitly asked for deleted rows.
    const repository = dataSource.getRepository(SportsArticle);
    expect(await repository.count()).toBe(1);
    expect(await repository.count({ withDeleted: true })).toBe(2);
  });

  it('resolves an entity reference through the same lookup as article(id)', async () => {
    const article = await createArticle('Federated');

    const result = await execute(
      `query Entities($reps: [_Any!]!) {
         _entities(representations: $reps) { ... on SportsArticle { id title } }
       }`,
      { reps: [{ __typename: 'SportsArticle', id: article.id }] },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?._entities).toEqual([{ id: article.id, title: 'Federated' }]);
  });

  it('returns null for an entity reference that is not a uuid', async () => {
    const result = await execute(
      `query Entities($reps: [_Any!]!) {
         _entities(representations: $reps) { ... on SportsArticle { id } }
       }`,
      { reps: [{ __typename: 'SportsArticle', id: 'not-a-uuid' }] },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?._entities).toEqual([null]);
  });

  it('reports false when the same article is deleted twice', async () => {
    const article = await createArticle('Delete me twice');
    const query = `mutation Delete($id: ID!) { deleteArticle(id: $id) }`;

    expect((await execute(query, { id: article.id })).data?.deleteArticle).toBe(true);
    expect((await execute(query, { id: article.id })).data?.deleteArticle).toBe(false);
  });

  it('refuses to update a soft-deleted article with NOT_FOUND', async () => {
    const article = await createArticle('Gone');
    await execute(`mutation Delete($id: ID!) { deleteArticle(id: $id) }`, { id: article.id });

    const result = await execute(
      `mutation Update($id: ID!, $input: ArticleInput!) {
         updateArticle(id: $id, input: $input) { id }
       }`,
      { id: article.id, input: { title: 'New', content: 'New body.' } },
    );

    expect(result.errors?.[0].extensions?.code).toBe('NOT_FOUND');
  });
});
