import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // 1. Global Ignores: Added 'js/vendor/' to the list
  { 
    ignores: [
      'dist', 
      'coverage', 
      'node_modules',
      'js/vendor/',
    ] 
  },

  // 2. Base Javascript Recommended Rules
  js.configs.recommended,

  // 3. Your Custom Configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },

  // 4. Prettier Config (MUST be last)
  eslintConfigPrettier,
];
