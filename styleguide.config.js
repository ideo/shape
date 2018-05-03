const webpackConfig = require('./config/webpack/development')

module.exports = {
  components: 'app/javascript/ui/**/[A-Z]*.js',
  webpackConfig: {
    resolve: webpackConfig.resolve,
    module: {
      rules: webpackConfig.module.rules,
    },
  },
}
