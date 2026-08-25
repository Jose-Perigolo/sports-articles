import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NormalizedCacheObject } from '@apollo/client';
import { ArticleForm } from '../../../components/ArticleForm';
import {
  ArticleDocument,
  type ArticleQuery,
  type ArticleQueryVariables,
  useArticleQuery,
  useUpdateArticleMutation,
} from '../../../graphql/generated/graphql';
import { APOLLO_STATE_PROP_NAME, createApolloClient } from '../../../lib/apolloClient';
import type { ArticleFormValues } from '../../../lib/articleSchema';

const LOAD_FAILED_MESSAGE =
  'Could not load this article. Check that the API is running, then reload this page.';

interface EditArticlePageProps {
  id: string;
  ssrError: boolean;
  initialApolloState: NormalizedCacheObject | null;
}

export default function EditArticlePage({ id, ssrError }: EditArticlePageProps) {
  const router = useRouter();
  const { data, error } = useArticleQuery({ variables: { id } });
  const [updateArticle] = useUpdateArticleMutation();

  const article = data?.article ?? null;
  const failed = ssrError || Boolean(error);

  const onSubmit = async (values: ArticleFormValues) => {
    await updateArticle({
      variables: {
        id,
        input: {
          title: values.title,
          content: values.content,
          imageUrl: values.imageUrl === '' ? null : values.imageUrl,
        },
      },
    });

    await router.push(`/article/${id}`);
  };

  return (
    <>
      <Head>
        <title>{article ? `Edit: ${article.title}` : 'Edit article'} — Sports Articles</title>
      </Head>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href={`/article/${id}`} className="text-sm text-slate-600 hover:underline">
          ← Back to article
        </Link>
        <h1 className="mt-6 mb-8 text-3xl font-semibold tracking-tight">Edit article</h1>

        {failed ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {LOAD_FAILED_MESSAGE}
          </p>
        ) : null}

        {article ? (
          <ArticleForm
            defaultValues={{
              title: article.title,
              content: article.content,
              imageUrl: article.imageUrl ?? '',
            }}
            submitLabel="Save changes"
            cancelHref={`/article/${id}`}
            onSubmit={onSubmit}
          />
        ) : null}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EditArticlePageProps> = async (context) => {
  const raw = context.params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return { notFound: true };

  const client = createApolloClient();

  try {
    const { data } = await client.query<ArticleQuery, ArticleQueryVariables>({
      query: ArticleDocument,
      variables: { id },
    });

    // Same fork as the detail page: null means missing or soft-deleted, which is a 404.
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
