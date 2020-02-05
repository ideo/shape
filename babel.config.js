module.exports = function(api) {
  const validEnv = ['development', 'test', 'production']
  const currentEnv = api.env()
  const isDevelopmentEnv = api.env('development')
  const isProductionEnv = api.env('production')
  const isTestEnv = api.env('test')

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
