const environment = require('./environment')

// https://github.com/rails/webpacker/issues/1235#issuecomment-382007521
environment.config.optimization.minimizer[0].options.uglifyOptions.ecma = 5 // the default, or 5 if you want it explicitely

module.exports = environment.toWebpackConfig()
