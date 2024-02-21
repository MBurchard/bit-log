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
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
    '@stylistic/indent': ['warn', 2, {
      CallExpression: {
        arguments: 1,
      },
      FunctionDeclaration: {
        parameters: 2,
        body: 1,
      },
      FunctionExpression: {
        parameters: 2,
        body: 1,
      },
      MemberExpression: 1,
      SwitchCase: 1,
    }],
    '@stylistic/operator-linebreak': ['warn', 'after'],
    '@stylistic/quotes': ['warn', 'single'],
    '@stylistic/semi': ['warn', 'always'],
    '@typescript-eslint/consistent-type-imports': 'error',
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
