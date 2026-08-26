import 'reflect-metadata';
import { dataSource } from './data-source';
import { SportsArticle } from './entities/SportsArticle';
import { loadExampleArticles } from './example-data';

async function seed(): Promise<void> {
  const articles = loadExampleArticles();

  await dataSource.initialize();
  try {
    const repository = dataSource.getRepository(SportsArticle);

    // Hard delete, not softDelete: a re-run must clear rows the reviewer soft-deleted
    // through the UI too, or they accumulate invisibly. repository.delete({}) is not an
    // option; TypeORM 1.x rejects empty criteria.
    await repository.createQueryBuilder().delete().from(SportsArticle).execute();

    const rows = articles.map((article) =>
      repository.create({
        title: article.title,
        content: article.content,
        imageUrl: article.imageUrl,
        createdAt: article.createdAt,
      }),
    );

    await repository.save(rows);

    console.log(
      `Seeded ${rows.length} sports articles from docs/data-example.csv ` +
        `(topic-matched images from image-picks.ts).`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
