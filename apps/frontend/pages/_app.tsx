import { ApolloProvider } from '@apollo/client';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Inter } from 'next/font/google';
import { SiteFooter } from '../components/SiteFooter';
import { useApollo } from '../lib/apolloClient';
import '../styles/globals.css';

// Self-hosted at build time by next/font, so the running app makes no request to Google.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

const WIDE_ROUTES = new Set(['/']);

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const client = useApollo(pageProps as Record<string, unknown>);

  return (
    <ApolloProvider client={client}>
      <div className={`${inter.className} flex min-h-screen flex-col bg-ground text-ink`}>
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <SiteFooter wide={WIDE_ROUTES.has(router.pathname)} />
      </div>
    </ApolloProvider>
  );
}
