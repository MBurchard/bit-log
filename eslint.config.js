import antfu from '@antfu/eslint-config';

export default antfu({
  ignores: [
    '*.svg',
  ],
  stylistic: {
    semi: true,
  },
}, {
  rules: {
    curly: 'off',
    'regexp/strict': 'off',
    'style/block-spacing': ['error', 'never'],
    'style/brace-style': ['error', '1tbs'],
    'style/max-len': ['warn', {code: 120}],
    'style/object-curly-spacing': ['error', 'never'],
    'style/operator-linebreak': ['error', 'after'],
    'style/quote-props': ['error', 'as-needed', {unnecessary: true}],
  },
}, {
  files: ['**/*.md'],
  rules: {
    'style/no-trailing-spaces': 'off',
    'style/max-len': 'off',
  },
}, {
  files: ['**/package.json'],
  rules: {
    'style/max-len': 'off',
  },
});
