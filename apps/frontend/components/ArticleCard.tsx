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
      className="flex flex-col overflow-hidden border border-rule bg-surface"
    >
      <div className="relative aspect-[16/9] bg-ground">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        {published ? (
          <time
            dateTime={article.createdAt ?? undefined}
            className="text-xs tracking-[0.08em] text-muted uppercase"
          >
            {published}
          </time>
        ) : null}

        <h2 className="text-lg leading-snug font-semibold text-emphasis">
          <Link
            href={`/article/${article.id}`}
            className="rounded-sm hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
          >
            {article.title}
          </Link>
        </h2>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{excerpt}</p>

        <div className="mt-auto flex items-center gap-5 pt-5">
          <Link
            href={`/article/${article.id}/edit`}
            className="inline-flex border border-rule px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:border-emphasis hover:text-emphasis focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
          >
            Edit
          </Link>
          {/* Quiet by default, red only on hover and focus: destructive, not decorative.
              It stays a permanently visible, text-labelled, focusable control. */}
          <button
            type="button"
            onClick={() => onDelete(article)}
            disabled={deleting}
            className="-mx-1 rounded-sm px-1 py-1.5 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:text-danger focus-visible:ring-2 focus-visible:ring-danger focus-visible:outline-none disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
}
