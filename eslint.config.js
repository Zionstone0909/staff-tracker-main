import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { 
    // Ignore build output directory
    ignores: ['dist', 'node_modules'] 
  },
  {
    // Apply to all TypeScript and TSX files
    files: ['**/*.{ts,tsx}'], 
    
    // Combine base, TypeScript, and React recommended settings
    extends: [
      js.configs.recommended, 
      ...tseslint.configs.recommended,
      // Recommended: Use the standard way to apply React hooks rules
      reactHooks.configs.recommended, 
    ],
    
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module', // Added: Needed for modern TS/React projects
      globals: {
        ...globals.browser,
        ...globals.es2020, // Added: Ensure modern standard library globals are available
      },
      parserOptions: { // Added: Important for TypeScript configuration
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    
    plugins: {
      // 'react-hooks' is now applied via 'extends' above, but still listed here 
      // if you need to reference its rules explicitly later.
      'react-refresh': reactRefresh,
    },
    
    rules: {
      // AVOID REDUNDANCY: Removed redundant spread of reactHooks.configs.recommended.rules 
      // as it's already in 'extends' above.
      
      // Mandatory for React Fast Refresh (Vite)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Ignore unused function arguments that start with '_'
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      
      // Use 'off' or 'error' instead of 'warn' for type definitions, and consider 
      // adding the 'allowExpressions' option.
      '@typescript-eslint/explicit-function-return-type': 'off', // 'off' is standard for React components
      
      // RECOMMENDED ADDITIONS:
      // Enables type checking within the linting process
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Enforce the use of consistent import types
      '@typescript-eslint/consistent-type-imports': 'error', 
    },
  }
);