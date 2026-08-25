import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // The checked-in SDL, never a running server: a reviewer doing a cold `pnpm install`
  // has nothing listening on :4000, and codegen must still work.
  schema: '../backend/schema.graphql',
  documents: ['graphql/operations/**/*.graphql'],
  generates: {
    'graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
      },
    },
  },
};

export default config;
