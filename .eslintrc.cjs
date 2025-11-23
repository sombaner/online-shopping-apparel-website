/* eslint-disable */
module.exports = {
  root: true,
  env: { node: true, browser: true, es2022: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  plugins: ['import','vue'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['warn', { 'newlines-between': 'always' }],
    'vue/multi-word-component-names': 'off'
  },
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.vue'] }
    }
  }
};
