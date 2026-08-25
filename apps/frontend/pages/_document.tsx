import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Without an explicit icon the browser requests /favicon.ico on every page and logs a 404. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body className="bg-ground text-ink antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
