module.exports = {
  plugins: [
    'jsx-a11y',
    'react',
    'jest',
    'cypress',
    'prettier',
    'import',
    'compat',
  ],
  env: {
    es6: true,
    node: true,
    'jest/globals': true,
    'cypress/globals': true,
  },
  extends: ['prettier', 'plugin:prettier/recommended', 'prettier/react'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      legacyDecorators: true,
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
    polyfills: [
      // Example of marking entire API and all methods and properties as polyfilled
      'Array.from',
      'Promise',
      'Object.assign',
      'Object.values',
      'fetch',
      'Array.prototype.push',
    ],
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        args: 'none',
      },
    ],
    'no-var': 'error',
    'prefer-const': 'error',
    'import/no-unresolved': 2,
    'import/prefer-default-export': 'off',
    'import/no-absolute-path': 0,
    'import/extensions': 0,
    'import/named': 2,
    'compat/compat': 'warn',
    'arrow-parens': [0, 'as-needed'],
    // because of all of our rails API snake_case variables
    camelcase: 0,
    'func-names': 0,
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': 0,
    'no-undef': 2,
    'no-duplicate-imports': 2,
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prettier/prettier': 'error',
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        // this is the part we changed... annoying when it wants:
        // ;({ variable } = object) -- instead of:
        // variable = object.variable
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
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
    'react/jsx-no-undef': [2, { allowGlobals: true }],
    'react/no-did-mount-set-state': 0,
    'react/no-unknown-property': 2,
    'react/jsx-uses-vars': 1,
    'react/prop-types': 2,
    'react/require-default-props': 1,
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
