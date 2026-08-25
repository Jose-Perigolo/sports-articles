import { ApolloProvider } from '@apollo/client';
import type { AppProps } from 'next/app';
import { useApollo } from '../lib/apolloClient';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const client = useApollo(pageProps as Record<string, unknown>);

  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
