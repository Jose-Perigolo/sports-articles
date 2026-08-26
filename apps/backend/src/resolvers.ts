import { GraphQLContext } from './context';
import { notFound } from './errors';
import { SportsArticleResponse, toArticleResponse } from './mappers';
import { parseArticleInput } from './validation';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ArticlesArgs {
  limit?: number | null;
  offset?: number | null;
}

interface ArticleArgs {
  id: string;
}

interface CreateArticleArgs {
  input: unknown;
}

interface UpdateArticleArgs extends ArticleArgs {
  input: unknown;
}

interface ArticleReference {
  id: string;
}

export const resolvers = {
  SportsArticle: {
    /**
     * Federation entity resolution. Deliberately the same lookup as Query.article: same
     * uuid guard, same mapper, so a gateway and a direct client cannot disagree about what
     * an article is.
     */
    async __resolveReference(
      reference: ArticleReference,
      { articles }: GraphQLContext,
    ): Promise<SportsArticleResponse | null> {
      if (!UUID_PATTERN.test(reference.id)) return null;

      const article = await articles.findOneBy({ id: reference.id });
      return article ? toArticleResponse(article) : null;
    },
  },

  Query: {
    async articles(
      _parent: unknown,
      { limit, offset }: ArticlesArgs,
      { articles }: GraphQLContext,
    ): Promise<SportsArticleResponse[]> {
      // Clamped at both ends: the cap keeps a client from asking for the whole table, and
      // TypeORM throws on a negative take.
      const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
      const skip = Math.max(offset ?? 0, 0);

      const rows = await articles.find({
        // id breaks ties so offset pagination can never repeat or skip a row.
        order: { createdAt: 'DESC', id: 'DESC' },
        take,
        skip,
      });

      return rows.map(toArticleResponse);
    },

    async article(
      _parent: unknown,
      { id }: ArticleArgs,
      { articles }: GraphQLContext,
    ): Promise<SportsArticleResponse | null> {
      // Postgres raises "invalid input syntax for type uuid" for anything that is not a
      // uuid, and a page routed straight from the URL will hand us exactly that. No such
      // row can exist, so the honest answer is null, which the frontend turns into a 404.
      if (!UUID_PATTERN.test(id)) return null;

      const article = await articles.findOneBy({ id });
      return article ? toArticleResponse(article) : null;
    },
  },

  Mutation: {
    async createArticle(
      _parent: unknown,
      { input }: CreateArticleArgs,
      { articles }: GraphQLContext,
    ): Promise<SportsArticleResponse> {
      const values = parseArticleInput(input);
      const saved = await articles.save(articles.create(values));
      return toArticleResponse(saved);
    },

    async updateArticle(
      _parent: unknown,
      { id, input }: UpdateArticleArgs,
      { articles }: GraphQLContext,
    ): Promise<SportsArticleResponse> {
      const values = parseArticleInput(input);

      const article = UUID_PATTERN.test(id) ? await articles.findOneBy({ id }) : null;
      if (!article) throw notFound(`No article with id ${id}`);

      const saved = await articles.save(articles.merge(article, values));
      return toArticleResponse(saved);
    },

    async deleteArticle(
      _parent: unknown,
      { id }: ArticleArgs,
      { articles }: GraphQLContext,
    ): Promise<boolean> {
      if (!UUID_PATTERN.test(id)) return false;

      // softDelete only touches rows that are still live, so deleting twice reports
      // false on the second call rather than throwing.
      const result = await articles.softDelete(id);
      return result.affected === 1;
    },
  },
};
