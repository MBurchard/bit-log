/**
 * .eslintrc.cjs
 */
module.exports = {
  root: true,
  env: {
    'es2021': true,
    node: true,
    browser: false,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    'comma-dangle': ['warn', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-mixed-operators': 'off', // the logic of && and || should be known to every developer
    'object-curly-newline': ['warn', {multiline: true, consistent: true}],
    'object-curly-spacing': ['warn', 'never'],
    quotes: ['warn', 'single'],
    semi: ['warn', 'always'],
    'space-before-function-paren': ['warn', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    }],
    'spaced-comment': ['warn', 'always'],
    'max-len': ['warn', {
      code: 120, tabWidth: 2, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true,
    }],
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
};
