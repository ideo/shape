'use strict'

const webpack = require('webpack')
const {environment} = require('@rails/webpacker')
const path = require('path')
const {castArray, identity, flow, mapValues} = require('lodash/fp')

const DEV = process.env.RAILS_ENV === 'development'
const root = p => path.resolve(__dirname, '..', '..', p)

const prepend = item => array => [item, ...array]

const addReactHotLoader = env => {
  env.config.set('devtool', 'cheap-module-source-map')
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
    {after: 'file'}
  )

  const fileLoader = env.loaders.get('file')
  fileLoader.exclude = /\.(svg)$/i

  return env
}

const prependBabelPolyfill = mapValues(
  flow(castArray, prepend(path.resolve(__dirname, 'babelPolyfill.js')))
)

const addBabelPolyfill = env => {
  const entry = env.config.get('entry')
  env.config.set('entry', prependBabelPolyfill(entry))
  return env
}

const addTypescriptLoader = env => {
  env.loaders.append('typescript', {
    test: /\.(ts|tsx)?(\.erb)?$/,
    use: [
      {
        loader: 'babel-loader',
        options: {cacheDirectory: true},
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
  env.plugins.insert('Provide', new webpack.ProvidePlugin({
    React: 'react'
  }))
  return env
}

const updateEnvironment = flow(
  DEV ? addReactHotLoader : identity,
  addReactGlobal,
  addReactSVGLoader,
  addBabelPolyfill,
  addTypescriptLoader,
  addIdeoSSOExternal,
  process.env.ANALYZE ? addBundleAnalyzerPlugin : identity
)

module.exports = updateEnvironment(environment)
