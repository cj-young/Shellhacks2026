//  @ts-check

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'dist',
      'dist-ssr',
      '.output',
      '.tanstack',
      '.nitro',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'always' },
      ],
    },
  },
  prettier,
)
