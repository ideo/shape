const { environment } = require('@rails/webpacker')
const webpack = require('webpack')

environment.plugins.set('Provide', new webpack.ProvidePlugin({
  React: 'react'
}))

module.exports = environment
