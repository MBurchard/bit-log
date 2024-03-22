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
  plugins: [
    '@stylistic',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@stylistic/comma-dangle': ['warn', {
      arrays: 'always-multiline',
      enums: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
      imports: 'always-multiline',
      objects: 'always-multiline',
    }],
    '@stylistic/indent': ['warn', 2, {
      CallExpression: {
        arguments: 1,
      },
      FunctionDeclaration: {
        parameters: 1,
        body: 1,
      },
      FunctionExpression: {
        parameters: 1,
        body: 1,
      },
      MemberExpression: 1,
      SwitchCase: 1,
    }],
    '@stylistic/operator-linebreak': ['warn', 'after'],
    '@stylistic/quotes': ['warn', 'single'],
    '@stylistic/semi': ['warn', 'always'],
    '@typescript-eslint/consistent-type-imports': 'error',
    'max-len': ['warn', {
      code: 120, tabWidth: 2, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true,
    }],
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-mixed-operators': 'off', // the logic of && and || should be known to every developer
    'object-curly-newline': ['warn', {multiline: true, consistent: true}],
    'object-curly-spacing': ['warn', 'never'],
    'space-before-function-paren': ['warn', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    }],
    'spaced-comment': 'off',
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
