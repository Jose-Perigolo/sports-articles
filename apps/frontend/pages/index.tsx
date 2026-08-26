import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { NormalizedCacheObject } from '@apollo/client';
import { ArticleCard } from '../components/ArticleCard';
import { useDeleteArticle } from '../lib/useDeleteArticle';
import {
  ArticlesDocument,
  type ArticlesQuery,
  type ArticlesQueryVariables,
  useArticlesQuery,
} from '../graphql/generated/graphql';
import { APOLLO_STATE_PROP_NAME, createApolloClient } from '../lib/apolloClient';

const PAGE_SIZE = 10;

const LOAD_FAILED_MESSAGE =
  'Could not load articles. Check that the API is running, then reload this page.';

interface HomeProps {
  ssrError: boolean;
  initialApolloState: NormalizedCacheObject | null;
}

export default function Home({ ssrError }: HomeProps) {
  const { data, error, fetchMore } = useArticlesQuery({
    variables: { limit: PAGE_SIZE, offset: 0 },
  });

  const { remove, deletingId, error: deleteError } = useDeleteArticle();

  const articles = data?.articles ?? [];
  const [exhausted, setExhausted] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlight = useRef(false);
  const initialPageChecked = useRef(false);

  // hasMore must not depend on articles.length. Deleting from a partially-loaded list drops
  // it below PAGE_SIZE, and a length-based guard would retire the sentinel with articles
  // still unfetched. Whether a page came back short is the only signal that the list ended,
  // including the initial SSR page.
  const hasMore = !exhausted;

  useEffect(() => {
    if (initialPageChecked.current || !data) return;
    initialPageChecked.current = true;
    if (data.articles.length < PAGE_SIZE) setExhausted(true);
  }, [data]);

  const loadMore = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoadingMore(true);

    try {
      // fetchMore resolves with this page's articles, not the merged cache value, so a
      // short page is the signal that there is nothing left.
      const result = await fetchMore({ variables: { offset: articles.length } });
      if (result.data.articles.length < PAGE_SIZE) setExhausted(true);
    } catch {
      setExhausted(true);
    } finally {
      inFlight.current = false;
      setLoadingMore(false);
    }
  }, [articles.length, fetchMore]);

  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const failed = ssrError || Boolean(error);

  return (
    <>
      <Head>
        <title>Sports Articles</title>
        <meta name="description" content="The latest sports reporting." />
      </Head>

      <div className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
        <header className="mb-16 border-b border-rule pb-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="text-4xl font-semibold tracking-tight text-emphasis">
                Sports Articles
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Reporting from across the sporting week,{' '}
                <span className="text-emphasis">newest first</span>.
              </p>
            </div>
            <Link
              href="/article/new"
              className="inline-flex bg-emphasis px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-ink focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Create article
            </Link>
          </div>
        </header>

        {failed ? (
          <p
            role="alert"
            className="border border-danger/30 bg-surface px-4 py-3 text-sm text-danger"
          >
            {LOAD_FAILED_MESSAGE}
          </p>
        ) : null}

        {deleteError ? (
          <p
            role="alert"
            className="mb-8 border border-danger/30 bg-surface px-4 py-3 text-sm text-danger"
          >
            {deleteError}
          </p>
        ) : null}

        {!failed && articles.length === 0 ? (
          <p className="border border-rule bg-surface px-4 py-16 text-center text-muted">
            No articles yet.{' '}
            <Link href="/article/new" className="text-emphasis underline underline-offset-4">
              Write the first one.
            </Link>
          </p>
        ) : null}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onDelete={(target) => void remove(target)}
              deleting={deletingId === article.id}
            />
          ))}
        </div>

        {hasMore ? (
          <div ref={sentinel} className="mt-16 flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="border border-rule bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-emphasis hover:text-emphasis focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const client = createApolloClient();

  try {
    await client.query<ArticlesQuery, ArticlesQueryVariables>({
      query: ArticlesDocument,
      variables: { limit: PAGE_SIZE, offset: 0 },
    });

    return {
      props: { [APOLLO_STATE_PROP_NAME]: client.cache.extract(), ssrError: false },
    };
  } catch (error) {
    // Server-side only. An Apollo network error carries the endpoint URL, and the client
    // gets a fixed generic message instead.
    console.error('SSR articles query failed:', error);

    return {
      props: { [APOLLO_STATE_PROP_NAME]: null, ssrError: true },
    };
  }
};
