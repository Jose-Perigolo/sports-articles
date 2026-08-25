import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApolloError } from '@apollo/client';
import Link from 'next/link';
import { articleFormSchema, type ArticleFormValues } from '../lib/articleSchema';

export interface ArticleFormProps {
  defaultValues: ArticleFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: ArticleFormValues) => Promise<void>;
}

const FIELDS = ['title', 'content', 'imageUrl'] as const;

function isFieldName(value: unknown): value is (typeof FIELDS)[number] {
  return typeof value === 'string' && (FIELDS as readonly string[]).includes(value);
}

export function ArticleForm({
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: ArticleFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues,
  });

  const formError = errors.root?.message;

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApolloError) {
        // The backend attaches extensions.field to BAD_USER_INPUT so the message can land on
        // the input that caused it instead of a form-level alert.
        const graphQLError = error.graphQLErrors[0];
        const field = graphQLError?.extensions?.field;

        if (graphQLError && isFieldName(field)) {
          setError(field, { message: graphQLError.message });
          return;
        }

        setError('root', { message: graphQLError?.message ?? error.message });
        return;
      }

      setError('root', { message: 'Something went wrong. Please try again.' });
    }
  });

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-7" noValidate>
      {formError ? (
        <p
          role="alert"
          className="border border-danger/30 bg-surface px-4 py-3 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-emphasis">
          Title
        </label>
        <input
          id="title"
          type="text"
          // defaultValue as well as useForm's defaultValues: register() sets the DOM value
          // from a ref on mount, which never runs during SSR, so without this the
          // server-rendered input would arrive empty.
          defaultValue={defaultValues.title}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className="border border-rule bg-surface px-3.5 py-2.5 text-ink focus:border-emphasis focus:outline-none"
          {...register('title')}
        />
        {errors.title ? (
          <p id="title-error" role="alert" className="text-sm text-danger">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium text-emphasis">
          Content
        </label>
        <textarea
          id="content"
          rows={12}
          defaultValue={defaultValues.content}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={errors.content ? 'content-error' : undefined}
          className="border border-rule bg-surface px-3.5 py-2.5 text-ink focus:border-emphasis focus:outline-none"
          {...register('content')}
        />
        {errors.content ? (
          <p id="content-error" role="alert" className="text-sm text-danger">
            {errors.content.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="imageUrl" className="text-sm font-medium text-emphasis">
          Image URL <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="imageUrl"
          type="text"
          placeholder="https://example.com/photo.jpg"
          defaultValue={defaultValues.imageUrl}
          aria-invalid={Boolean(errors.imageUrl)}
          aria-describedby={errors.imageUrl ? 'imageUrl-error' : undefined}
          className="border border-rule bg-surface px-3.5 py-2.5 text-ink focus:border-emphasis focus:outline-none"
          {...register('imageUrl')}
        />
        {errors.imageUrl ? (
          <p id="imageUrl-error" role="alert" className="text-sm text-danger">
            {errors.imageUrl.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex bg-emphasis px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-ink focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-sm text-sm text-muted underline-offset-4 transition-colors hover:text-emphasis hover:underline focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
