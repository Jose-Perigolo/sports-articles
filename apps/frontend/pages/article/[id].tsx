import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { NormalizedCacheObject } from '@apollo/client';
import {
  ArticleDocument,
  type ArticleQuery,
  type ArticleQueryVariables,
  useArticleQuery,
} from '../../graphql/generated/graphql';
import { APOLLO_STATE_PROP_NAME, createApolloClient } from '../../lib/apolloClient';
import { formatDate } from '../../lib/formatDate';

const LOAD_FAILED_MESSAGE =
  'Could not load this article. Check that the API is running, then reload this page.';

interface ArticlePageProps {
  id: string;
  ssrError: boolean;
  initialApolloState: NormalizedCacheObject | null;
}

export default function ArticlePage({ id, ssrError }: ArticlePageProps) {
  const { data, error } = useArticleQuery({ variables: { id } });
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

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← All articles
        </Link>

        {failed ? (
          <p
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {LOAD_FAILED_MESSAGE}
          </p>
        ) : null}

        {article ? (
          <article className="mt-6">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{article.title}</h1>

            {published ? (
              <time
                dateTime={article.createdAt ?? undefined}
                className="mt-2 block text-xs tracking-wide text-slate-500 uppercase"
              >
                {published}
              </time>
            ) : null}

            {article.imageUrl ? (
              <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-4 text-slate-800">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <Link
                href={`/article/${article.id}/edit`}
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Edit
              </Link>
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
