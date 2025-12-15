import convexPlugin from '@convex-dev/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * ESLint Configuration
 *
 * This configuration provides comprehensive linting for TypeScript, React, and Convex code.
 * Note: Formatting is handled by Biome (see biome.json). ESLint focuses on code quality rules.
 *
 * Key Rules:
 * - @typescript-eslint/no-unused-vars - Detect unused variables
 * - @typescript-eslint/no-explicit-any - Warn on explicit any types
 * - no-param-reassign - Prevent parameter reassignment
 * - @typescript-eslint/prefer-as-const - Prefer const assertions
 * - @typescript-eslint/default-param-last - Require default parameters to be last
 * - react/self-closing-comp - Enforce self-closing tags
 * - one-var - Enforce single variable declarations
 * - @typescript-eslint/no-inferrable-types - Disallow explicit types for inferrable values
 * - no-else-return - Disallow unnecessary else blocks
 * - @typescript-eslint/array-type - Enforce consistent array type syntax
 */

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.nx/**',
      '**/dist/**',
      '**/build/**',
      '**/.convex/**',
      '**/.git/**',
      '**/convex/_generated/**',
    ],
  },

  // Base TypeScript configuration for all files
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@convex-dev': convexPlugin,
      jsdoc: jsdocPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ============================================
      // TypeScript Rules
      // ============================================

      // Detect unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Warn on explicit any types
      '@typescript-eslint/no-explicit-any': 'warn',

      // ============================================
      // Code Style Rules
      // ============================================

      // Prevent parameter reassignment
      'no-param-reassign': 'error',

      // useAsConstAssertion: error
      '@typescript-eslint/prefer-as-const': 'error',

      // useDefaultParameterLast: error
      '@typescript-eslint/default-param-last': 'error',

      // useSelfClosingElements: error
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],

      // useSingleVarDeclarator: error
      'one-var': ['error', 'never'],

      // noInferrableTypes: error
      '@typescript-eslint/no-inferrable-types': 'error',

      // noUselessElse: error
      'no-else-return': ['error', { allowElseIf: false }],

      // useConsistentArrayType: error (shorthand syntax like string[] instead of Array<string>)
      '@typescript-eslint/array-type': ['error', { default: 'array' }],

      // ============================================
      // React Hooks rules
      // ============================================
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================
      // Convex-specific rules
      // ============================================
      '@convex-dev/explicit-table-ids': 'error',

      // ============================================
      // Additional recommended rules
      // ============================================
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // ============================================
      // JSDoc rules (enforces cleanup guideline Step 1)
      // Note: These are warnings to encourage documentation without blocking development
      // ============================================
      'jsdoc/require-jsdoc': [
        'off', // Disabled by default - enable when doing cleanup
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: [
            'ExportNamedDeclaration > TSInterfaceDeclaration',
            'ExportNamedDeclaration > TSTypeAliasDeclaration',
            'ExportNamedDeclaration > VariableDeclaration[kind="const"]',
          ],
          publicOnly: true,
        },
      ],
      'jsdoc/require-param': 'off', // Enable during cleanup
      'jsdoc/require-param-description': 'off', // Enable during cleanup
      'jsdoc/require-param-type': 'off', // TypeScript handles this
      'jsdoc/require-returns': 'off', // Enable during cleanup
      'jsdoc/require-returns-description': 'off', // Enable during cleanup
      'jsdoc/require-returns-type': 'off', // TypeScript handles this
      'jsdoc/check-tag-names': 'error', // Always validate tag names
      'jsdoc/check-types': 'off', // TypeScript handles this
      'jsdoc/valid-types': 'off', // TypeScript handles this
      'jsdoc/no-undefined-types': 'off', // TypeScript handles this

      // ============================================
      // Import ordering rules (enforces cleanup guideline Step 3)
      // ============================================
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // External packages
            'internal', // Internal modules
            ['parent', 'sibling', 'index'], // Relative imports
          ],
          'newlines-between': 'always', // Allow blank lines between groups
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // ============================================
      // TypeScript-specific rules for better type safety
      // ============================================
      '@typescript-eslint/explicit-function-return-type': 'off', // Too noisy - TypeScript inference is good
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },

  // TypeScript files - enable type-aware linting for Convex rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },

  // JavaScript files - disable TypeScript-specific rules
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/default-param-last': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/array-type': 'off',
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts,mjs,cjs}', 'postcss.config.mjs'],
    rules: {
      'no-console': 'off',
    },
  },

  // Script files - console.log is expected
  {
    files: ['**/scripts/**/*.{js,ts,mjs,cjs}'],
    rules: {
      'no-console': 'off',
    },
  },

  // Migration files - console.log is expected for debugging migrations
  {
    files: ['**/migration.ts', '**/migrations/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // API callback pages - console.log is expected for debugging OAuth flows
  {
    files: ['**/api/**/callback/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
];
