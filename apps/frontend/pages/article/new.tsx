import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArticleForm } from '../../components/ArticleForm';
import { useCreateArticleMutation } from '../../graphql/generated/graphql';
import type { ArticleFormValues } from '../../lib/articleSchema';

export default function NewArticlePage() {
  const router = useRouter();
  const [createArticle] = useCreateArticleMutation();

  const onSubmit = async (values: ArticleFormValues) => {
    const result = await createArticle({
      variables: {
        input: {
          title: values.title,
          content: values.content,
          imageUrl: values.imageUrl === '' ? null : values.imageUrl,
        },
      },
      update(cache) {
        // With keyArgs: false the merged articles list is a single ROOT_QUERY field that a
        // create writes nothing into, so it has to be dropped and refetched. Update needs no
        // equivalent — Apollo normalises by id.
        cache.evict({ id: 'ROOT_QUERY', fieldName: 'articles' });
        cache.gc();
      },
    });

    const created = result.data?.createArticle;
    if (created) await router.push(`/article/${created.id}`);
  };

  return (
    <>
      <Head>
        <title>New article — Sports Articles</title>
      </Head>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← All articles
        </Link>
        <h1 className="mt-6 mb-8 text-3xl font-semibold tracking-tight">New article</h1>

        <ArticleForm
          defaultValues={{ title: '', content: '', imageUrl: '' }}
          submitLabel="Create article"
          cancelHref="/"
          onSubmit={onSubmit}
        />
      </div>
    </>
  );
}
