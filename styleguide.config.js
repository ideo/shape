const webpackConfig = require('./config/webpack/development')

module.exports = {
  title: 'Shape | Styleguide',
  components: 'app/javascript/ui/global/**/*.js',
  webpackConfig: {
    resolve: webpackConfig.resolve,
    module: {
      rules: webpackConfig.module.rules,
    },
    plugins: webpackConfig.plugins,
  },
}
