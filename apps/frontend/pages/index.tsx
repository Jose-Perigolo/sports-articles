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

      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Sports Articles</h1>
            <p className="mt-1 text-slate-600">The latest reporting, newest first.</p>
          </div>
          <Link
            href="/article/new"
            className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Create article
          </Link>
        </header>

        {failed ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {LOAD_FAILED_MESSAGE}
          </p>
        ) : null}

        {deleteError ? (
          <p
            role="alert"
            className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {deleteError}
          </p>
        ) : null}

        {!failed && articles.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
            No articles yet.{' '}
            <Link href="/article/new" className="underline">
              Write the first one.
            </Link>
          </p>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div ref={sentinel} className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
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
