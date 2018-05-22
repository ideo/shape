const { environment } = require('@rails/webpacker')
const path = require('path')
const { castArray, flow, mapValues } = require('lodash/fp')
const webpack = require('webpack')

const prepend = item => array => [item, ...array]

const prependBabelPolyfill = mapValues(
  flow(castArray, prepend(path.resolve(__dirname, 'babelPolyfill.js')))
)

const addBabelPolyfill = env => {
  env.entry.app = prependBabelPolyfill(env.entry).app
  return env
}

const provideReact = env => {
  env.plugins.set('Provide', new webpack.ProvidePlugin({
    React: 'react'
  }))
  return env
}

const updateEnvironment = flow(
  addBabelPolyfill,
  provideReact,
)

module.exports = updateEnvironment(environment)
