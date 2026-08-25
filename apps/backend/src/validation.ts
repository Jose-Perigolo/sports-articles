import { z } from 'zod';
import { badUserInput } from './errors';

const TITLE_MAX_LENGTH = 200;

/**
 * Protocol matters as much as shape here. URL.canParse accepts `javascript:`, `data:` and
 * `ftp:`, and this value is handed straight to the frontend's image renderer — restricting it
 * to http(s) is what lets `images.remotePatterns` stay permissive about the host.
 */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export const articleInputSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer`),
  content: z.string({ error: 'Content is required' }).trim().min(1, 'Content is required'),
  imageUrl: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || isHttpUrl(value), {
      message: 'Image URL must start with http:// or https://',
    }),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

export function parseArticleInput(input: unknown): ArticleInput {
  const result = articleInputSchema.safeParse(input);
  if (result.success) return result.data;

  const issue = result.error.issues[0];
  throw badUserInput(issue.message, issue.path.length > 0 ? String(issue.path[0]) : undefined);
}
