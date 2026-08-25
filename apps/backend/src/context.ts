import { Repository } from 'typeorm';
import { dataSource } from './data-source';
import { SportsArticle } from './entities/SportsArticle';

export interface GraphQLContext {
  articles: Repository<SportsArticle>;
}

export async function createContext(): Promise<GraphQLContext> {
  return { articles: dataSource.getRepository(SportsArticle) };
}
