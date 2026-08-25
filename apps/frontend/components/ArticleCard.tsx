import Image from 'next/image';
import Link from 'next/link';
import type { ArticleFieldsFragment } from '../graphql/generated/graphql';
import { formatDate } from '../lib/formatDate';

export interface ArticleCardProps {
  article: ArticleFieldsFragment;
  onDelete: (article: ArticleFieldsFragment) => void;
  deleting: boolean;
}

export function ArticleCard({ article, onDelete, deleting }: ArticleCardProps) {
  const published = formatDate(article.createdAt);
  const excerpt = article.content.split('\n\n')[0];

  return (
    <article
      data-testid="article-card"
      data-article-id={article.id}
      className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[16/9] bg-slate-100">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="leading-snug font-semibold">
          <Link
            href={`/article/${article.id}`}
            className="hover:underline focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            {article.title}
          </Link>
        </h2>

        {published ? (
          <time
            dateTime={article.createdAt ?? undefined}
            className="text-xs tracking-wide text-slate-500 uppercase"
          >
            {published}
          </time>
        ) : null}

        <p className="line-clamp-3 text-sm text-slate-600">{excerpt}</p>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <Link
            href={`/article/${article.id}/edit`}
            className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => onDelete(article)}
            disabled={deleting}
            className="inline-flex rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:outline-none disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
}
