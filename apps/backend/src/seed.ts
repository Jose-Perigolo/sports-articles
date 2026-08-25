import 'reflect-metadata';
import { dataSource } from './data-source';
import { SportsArticle } from './entities/SportsArticle';
import { seedArticles } from './seed-data';

const STAGGER_MS = 6 * 60 * 60 * 1000;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    const repository = dataSource.getRepository(SportsArticle);

    // Hard delete, not softDelete: a re-run must clear rows the reviewer soft-deleted
    // through the UI too, or they accumulate invisibly. repository.delete({}) is not an
    // option — TypeORM 1.x rejects empty criteria.
    await repository.createQueryBuilder().delete().from(SportsArticle).execute();

    const now = Date.now();
    const rows = seedArticles.map((article, index) =>
      repository.create({
        title: article.title,
        content: article.content,
        imageUrl: `https://picsum.photos/seed/${slugify(article.title)}/800/450`,
        // Staggered backwards from the run time so `createdAt DESC` has a stable,
        // meaningful order instead of twenty rows sharing one timestamp.
        createdAt: new Date(now - index * STAGGER_MS),
      }),
    );

    await repository.save(rows);
    console.log(`Seeded ${rows.length} sports articles.`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
