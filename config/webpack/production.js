const environment = require('./environment')

// https://github.com/rails/webpacker/issues/1235#issuecomment-362417050
environment.plugins.get('UglifyJs').options.uglifyOptions.ecma = 5

module.exports = environment.toWebpackConfig()
