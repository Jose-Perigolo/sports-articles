import { useMemo } from 'react';
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  Reference,
} from '@apollo/client';

export const APOLLO_STATE_PROP_NAME = 'initialApolloState';

const DEFAULT_GRAPHQL_URL = 'http://localhost:4000/graphql';

function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          articles: {
            // One cache entry for every articles(limit, offset) call. Without this each
            // variable combination would be its own entry and fetchMore would replace the
            // list rather than extend it.
            keyArgs: false,

            merge(existing: Reference[] = [], incoming: Reference[], { args }): Reference[] {
              // offset is optional in the SDL and Apollo types args as nullable, so both
              // args and args.offset can be absent. existing[undefined + i] is existing[NaN],
              // which sets a string key on the array and leaves exactly the holes this
              // policy exists to prevent.
              const offset: number = args?.offset ?? 0;

              const merged = existing.slice();
              for (let index = 0; index < incoming.length; index += 1) {
                merged[offset + index] = incoming[index];
              }
              return merged;
            },
          },
        },
      },
    },
  });
}

export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_GRAPHQL_URL,
    }),
    cache: createCache(),
  });
}

/**
 * Merges one level into ROOT_QUERY instead of replacing it, so arriving on a detail page
 * does not discard the article list already accumulated in the cache.
 */
function mergeCacheState(
  existing: NormalizedCacheObject,
  incoming: NormalizedCacheObject,
): NormalizedCacheObject {
  const merged: NormalizedCacheObject = { ...existing, ...incoming };

  if (existing.ROOT_QUERY && incoming.ROOT_QUERY) {
    merged.ROOT_QUERY = { ...existing.ROOT_QUERY, ...incoming.ROOT_QUERY };
  }

  return merged;
}

let browserClient: ApolloClient<NormalizedCacheObject> | undefined;

export function initializeApollo(
  initialState?: NormalizedCacheObject | null,
): ApolloClient<NormalizedCacheObject> {
  const client = browserClient ?? createApolloClient();

  if (initialState) {
    client.cache.restore(mergeCacheState(client.extract(), initialState));
  }

  // A fresh client per request on the server; one shared client in the browser so
  // client-side navigation keeps its cache.
  if (typeof window === 'undefined') return client;

  browserClient ??= client;
  return client;
}

export function useApollo(pageProps: Record<string, unknown>): ApolloClient<NormalizedCacheObject> {
  const initialState = pageProps[APOLLO_STATE_PROP_NAME] as NormalizedCacheObject | undefined;
  return useMemo(() => initializeApollo(initialState), [initialState]);
}
