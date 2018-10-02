module.exports = {
  plugins: ['react', 'jest', 'cypress', 'prettier'],
  env: {
    'jest/globals': true,
    'cypress/globals': true,
  },
  extends: [
    'airbnb',
    'standard',
    'standard-react',
    'plugin:prettier/recommended',
    'prettier/react',
    'prettier/standard',
  ],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  globals: {
    __DEV__: false,
    __PROD__: false,
    __DEBUG__: false,
    fetch: true,
    webpack: true,
    React: true,
    // for enzyme tests
    shallow: true,
    render: true,
    mount: true,
    relPath: true,
    localStorage: true,
    FileReader: true,
    DOMParser: true,
    IdeoSSO: true,
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
      node: {},
    },
    'module-resolver': {},
    'import/core-modules': ['styled-jsx/css'],
  },
  rules: {
    'arrow-parens': [0, 'as-needed'],
    // because of all of our rails API snake_case variables
    camelcase: 0,
    'func-names': 0,
    'import/no-absolute-path': 0,
    'import/extensions': 0,
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': 0,
    'prettier/prettier': 'error',
    radix: ['error', 'as-needed'],
    'space-before-function-paren': 0,
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to', 'hrefLeft', 'hrefRight'],
        aspects: ['noHref', 'invalidHref', 'preferButton'],
      },
    ],
    'react-in-jsx-scope': 0,
    'react/jsx-filename-extension': 0,
    'react/prefer-stateless-function': 0,
    'react/jsx-curly-brace-presence': 0,
    'react/jsx-closing-tag-location': 0,
    'react/no-did-mount-set-state': 0,
    'react/sort-comp': [
      1,
      {
        order: [
          'static-methods',
          'instance-variables',
          'lifecycle',
          'everything-else',
          'render',
        ],
      },
    ],
  },
}
