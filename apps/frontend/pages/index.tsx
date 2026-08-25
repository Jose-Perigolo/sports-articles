import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Sports Articles</title>
      </Head>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Sports Articles</h1>
        <p className="text-slate-600">
          The frontend is wired up. The article list arrives in the next step.
        </p>
        <p className="text-sm text-slate-500">
          API:{' '}
          <code className="rounded bg-slate-200 px-1.5 py-0.5">
            {process.env.NEXT_PUBLIC_GRAPHQL_URL}
          </code>
        </p>
      </main>
    </>
  );
}
