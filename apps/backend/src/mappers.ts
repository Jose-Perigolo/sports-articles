import { SportsArticle } from './entities/SportsArticle';

export interface SportsArticleResponse {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
}

/**
 * Dates must be converted explicitly. graphql-js coerces an object-like value by calling
 * valueOf() first, and Date.valueOf() is a number, so handing a raw Date to a String field
 * silently serialises as a millisecond timestamp ("1709288430000") instead of an ISO string.
 */
export function toArticleResponse(article: SportsArticle): SportsArticleResponse {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    imageUrl: article.imageUrl,
    createdAt: article.createdAt.toISOString(),
    deletedAt: article.deletedAt ? article.deletedAt.toISOString() : null,
  };
}
