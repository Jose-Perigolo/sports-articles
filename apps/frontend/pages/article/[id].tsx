import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NormalizedCacheObject } from '@apollo/client';
import {
  ArticleDocument,
  type ArticleQuery,
  type ArticleQueryVariables,
  useArticleQuery,
} from '../../graphql/generated/graphql';
import { APOLLO_STATE_PROP_NAME, createApolloClient } from '../../lib/apolloClient';
import { formatDate } from '../../lib/formatDate';
import { useDeleteArticle } from '../../lib/useDeleteArticle';

const LOAD_FAILED_MESSAGE =
  'Could not load this article. Check that the API is running, then reload this page.';

interface ArticlePageProps {
  id: string;
  ssrError: boolean;
  initialApolloState: NormalizedCacheObject | null;
}

export default function ArticlePage({ id, ssrError }: ArticlePageProps) {
  const router = useRouter();
  const { data, error } = useArticleQuery({ variables: { id } });
  const { remove, deletingId, error: deleteError } = useDeleteArticle();
  const article = data?.article ?? null;
  const failed = ssrError || Boolean(error);

  const published = formatDate(article?.createdAt);
  const paragraphs = article ? article.content.split('\n\n') : [];

  return (
    <>
      <Head>
        <title>{article ? `${article.title} — Sports Articles` : 'Sports Articles'}</title>
        {article ? (
          <meta name="description" content={article.content.split('\n\n')[0].slice(0, 155)} />
        ) : null}
      </Head>

      <div className="mx-auto max-w-[42rem] px-6 py-20 sm:py-24">
        <Link
          href="/"
          className="rounded-sm text-sm text-muted underline-offset-4 transition-colors hover:text-emphasis hover:underline focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
        >
          ← All articles
        </Link>

        {failed ? (
          <p
            role="alert"
            className="mt-8 border border-danger/30 bg-surface px-4 py-3 text-sm text-danger"
          >
            {LOAD_FAILED_MESSAGE}
          </p>
        ) : null}

        {article ? (
          <article className="mt-10">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance text-emphasis">
              {article.title}
            </h1>

            {published ? (
              <time
                dateTime={article.createdAt ?? undefined}
                className="mt-4 block text-xs tracking-[0.08em] text-muted uppercase"
              >
                {published}
              </time>
            ) : null}

            {article.imageUrl ? (
              <div className="relative mt-10 aspect-[16/9] overflow-hidden bg-ground">
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="mt-10 flex flex-col gap-5 text-lg text-ink">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {deleteError ? (
              <p
                role="alert"
                className="mt-8 border border-danger/30 bg-surface px-4 py-3 text-sm text-danger"
              >
                {deleteError}
              </p>
            ) : null}

            <div className="mt-14 flex items-center gap-6 border-t border-rule pt-8">
              <Link
                href={`/article/${article.id}/edit`}
                className="inline-flex border border-rule px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-emphasis hover:text-emphasis focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => {
                  void remove(article).then((deleted) => {
                    // The article is gone from the cache; staying here would render nothing.
                    if (deleted) return router.push('/');
                  });
                }}
                disabled={deletingId === article.id}
                className="-mx-1 rounded-sm px-1 py-1.5 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:text-danger focus-visible:ring-2 focus-visible:ring-danger focus-visible:outline-none disabled:opacity-60"
              >
                {deletingId === article.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ArticlePageProps> = async (context) => {
  const raw = context.params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return { notFound: true };

  const client = createApolloClient();

  try {
    const { data } = await client.query<ArticleQuery, ArticleQueryVariables>({
      query: ArticleDocument,
      variables: { id },
    });

    // A null article means missing or soft-deleted — a real 404. This is deliberately not
    // the same branch as the catch below, which means the backend is unreachable.
    if (!data.article) return { notFound: true };

    return {
      props: { id, [APOLLO_STATE_PROP_NAME]: client.cache.extract(), ssrError: false },
    };
  } catch (error) {
    console.error(`SSR article query failed for ${id}:`, error);

    return {
      props: { id, [APOLLO_STATE_PROP_NAME]: null, ssrError: true },
    };
  }
};
