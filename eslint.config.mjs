import tsParser from '@typescript-eslint/parser';
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/tikz/**',
      'vendor/**',
      'research/**',
      'qa-results/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-constant-binary-expression': 'error',
      'valid-typeof': 'error',
      'constructor-super': 'error',
      'no-this-before-super': 'error',
      'no-unexpected-multiline': 'error',
      'no-loss-of-precision': 'error',
      'no-debugger': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
];
