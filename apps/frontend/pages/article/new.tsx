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
        // equivalent; Apollo normalises by id.
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
        <title>New article | Sports Articles</title>
      </Head>

      <div className="mx-auto max-w-[42rem] px-6 py-20 sm:py-24">
        <Link
          href="/"
          className="rounded-sm text-sm text-muted underline-offset-4 transition-colors hover:text-emphasis hover:underline focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
        >
          ← All articles
        </Link>
        <h1 className="mt-10 mb-12 text-4xl font-semibold tracking-tight text-emphasis">
          New article
        </h1>

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
