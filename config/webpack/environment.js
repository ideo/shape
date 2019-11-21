'use strict'

const webpack = require('webpack')
const { environment } = require('@rails/webpacker')
const path = require('path')
const { castArray, identity, flow, mapValues } = require('lodash/fp')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const DEV = process.env.RAILS_ENV === 'development'
const PROD = process.env.SHAPE_APP === 'production'
const root = p => path.resolve(__dirname, '..', '..', p)

const addReactHotLoader = env => {
  env.config.set('devtool', 'cheap-module-source-map')
  return env
}

const addCleanWebpack = env => {
  env.plugins.insert('CleanWebpackPlugin', new CleanWebpackPlugin())
  return env
}

const addBundleAnalyzerPlugin = env => {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin

  env.plugins.insert(
    'BundleAnalyze',
    new BundleAnalyzerPlugin({
      openAnalyzer: true,
      analyzerMode: 'static',
    })
  )

  return env
}

const addReactSVGLoader = env => {
  const babelLoader = env.loaders.get('babel')

  env.loaders.insert(
    'svg',
    {
      test: /\.svg$/,
      use: babelLoader.use.concat([
        {
          loader: 'react-svg-loader',
          options: {
            jsx: true, // true outputs JSX tags
          },
        },
      ]),
    },
    { after: 'file' }
  )

  const fileLoader = env.loaders.get('file')
  fileLoader.exclude = /\.(svg)$/i

  return env
}

const addTypescriptLoader = env => {
  env.loaders.append('typescript', {
    test: /\.(ts|tsx)?(\.erb)?$/,
    use: [
      {
        loader: 'babel-loader',
        options: { cacheDirectory: true },
      },
      {
        loader: 'ts-loader',
        options: {
          configFile: root('tsconfig.json'),
          experimentalWatchApi: true,
          transpileOnly: true,
        },
      },
    ],
    exclude: /node_modules/,
  })

  return env
}

const addIdeoSSOExternal = env => {
  env.config.set('externals.ideo-sso', 'IdeoSSO')

  return env
}

const addReactGlobal = env => {
  env.plugins.insert(
    'Provide',
    new webpack.ProvidePlugin({
      React: 'react',
    })
  )
  return env
}

const addSentryWebpack = env => {
  if (PROD) {
    env.plugins.insert(
      'Sentry',
      new SentryWebpackPlugin({
        include: '.',
        ignoreFile: '.sentrycliignore',
        ignore: ['node_modules', 'webpack.config.js'],
        configFile: 'sentry.properties'
      })
    )
  }
  return env
}

const updateEnvironment = flow(
  DEV ? addReactHotLoader : identity,
  addReactGlobal,
  addSentryWebpack,
  addReactSVGLoader,
  addTypescriptLoader,
  addIdeoSSOExternal,
  addCleanWebpack,
  process.env.ANALYZE ? addBundleAnalyzerPlugin : identity
)

module.exports = updateEnvironment(environment)
