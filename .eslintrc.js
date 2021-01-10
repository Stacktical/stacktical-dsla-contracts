module.exports = {
  env: {
    es2021: true,
    node: true,
    'truffle/globals': true,
    mocha: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'prefer-template': 'error',
    camelcase: 'off',
    'no-useless-concat': 'off',
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'no-param-reassign': 'off',
  },
  plugins: ['truffle', 'mocha'],
};
