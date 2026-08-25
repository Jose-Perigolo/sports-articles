import { useCallback, useState } from 'react';
import type { Reference } from '@apollo/client';
import { useDeleteArticleMutation } from '../graphql/generated/graphql';

export interface DeletableArticle {
  id: string;
  title: string;
}

export function useDeleteArticle() {
  const [mutate] = useDeleteArticleMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (article: DeletableArticle): Promise<boolean> => {
      if (!window.confirm(`Delete “${article.title}”? This cannot be undone.`)) return false;

      setError(null);
      setDeletingId(article.id);

      try {
        const result = await mutate({
          variables: { id: article.id },
          update(cache, { data }) {
            if (!data?.deleteArticle) return;

            // Remove the reference from the merged list *before* evicting the entity.
            // Evicting alone only makes the reference dangling: reads filter it out, but the
            // stored array keeps its slot, so stored length and rendered length drift apart.
            // The next page then loads at offset = rendered length and overwrites a live row,
            // silently costing one article.
            cache.modify({
              fields: {
                articles(existing: readonly Reference[] = [], { readField }) {
                  return existing.filter((ref) => readField('id', ref) !== article.id);
                },
              },
            });

            cache.evict({ id: cache.identify({ __typename: 'SportsArticle', id: article.id }) });
            cache.gc();
          },
        });

        if (!result.data?.deleteArticle) {
          setError('That article could not be deleted. It may already be gone.');
          return false;
        }

        return true;
      } catch {
        setError('Could not delete the article. Check that the API is running and try again.');
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [mutate],
  );

  return { remove, deletingId, error };
}
