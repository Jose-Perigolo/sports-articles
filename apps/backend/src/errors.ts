import { GraphQLError } from 'graphql';

/**
 * `field` lets the frontend attach the message to the input that caused it
 * (react-hook-form `setError`) instead of showing a form-level alert.
 */
export function badUserInput(message: string, field?: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', ...(field ? { field } : {}) },
  });
}

export function notFound(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
}
