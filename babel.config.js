// This file is currently being used by styleguidist but should be merged with
// .babelrc at some point.

module.exports = function(api) {
  return {
    sourceType: 'unambiguous',
    exclude: /node_modules/,
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: [
      'lodash',
      '@babel/plugin-syntax-dynamic-import',
      [
        '@babel/plugin-proposal-decorators',
        {
          legacy: true,
        },
      ],
      [
        '@babel/plugin-proposal-class-properties',
        {
          loose: true,
        },
      ],
      '@babel/plugin-transform-modules-commonjs',
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          alias: {
            '~shared': './app/javascript/ui/shared',
            '~': './app/javascript',
            '^~(.+)': './app/javascript/src/\\1',
            '#': './__js_test_config',
          },
        },
      ],
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: false,
          regenerator: true,
        },
      ],
    ],
    env: {
      development: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              fileName: false,
            },
          ],
        ],
      },
      production: {
        plugins: [
          'lodash',
          [
            'styled-components',
            {
              displayName: false,
            },
          ],
        ],
      },
    },
  }
}
