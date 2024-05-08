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
    'curly': 'off',
    'style/brace-style': ['error', '1tbs'],
    'style/max-len': ['warn', {code: 120}],
    'style/object-curly-spacing': ['error', 'never'],
    'style/operator-linebreak': ['error', 'after'],
  },
}, {
  files: ['**/*.md'],
  rules: {
    'style/max-len': 'off',
  },
});
