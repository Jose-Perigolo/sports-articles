import { z } from 'zod';

/**
 * Deliberately duplicated from `apps/backend/src/validation.ts`, which stays the source of
 * truth: the server re-validates everything this accepts. A shared workspace package
 * (`packages/shared-validation`) is where these rules belong once the project has more than
 * one consumer; adding one here would buy build-order complexity for no scored benefit.
 *
 * Keep in step with the backend: TITLE_MAX_LENGTH, the required messages, and the http(s)
 * restriction on imageUrl.
 */
const TITLE_MAX_LENGTH = 200;

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export const articleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer`),
  content: z.string().trim().min(1, 'Content is required'),
  // The input element yields '' rather than null when the field is left empty; the empty
  // case maps back to null on submit.
  imageUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || isHttpUrl(value), {
      message: 'Image URL must start with http:// or https://',
    }),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
