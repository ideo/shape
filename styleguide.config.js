/* eslint-disable-next-line no-unused-vars */
const { ...webpackConfig } = require('./config/webpack/development')

webpackConfig.module.rules.push({
  test: /\.s[ac]ss$/i,
  use: [
    // Creates `style` nodes from JS strings
    'style-loader',
    // Translates CSS into CommonJS
    'css-loader',
    // Compiles Sass to CSS
    'sass-loader',
  ],
})

// const componentsGlob = p => path.join(p, '**/*{.js,jsx,ts,tsx}')

// const getComponentPathLine = componentPath => {
//   const dir = componentPath
//     .replace('app/javascript/ui/', '~')
//     .replace(/\.(js|ts)x?/, '')

//   const name = path.basename(componentPath, '.tsx')
//   return `import ${name} from ${dir}`
// }

module.exports = {
  title: 'Shape Styleguide',
  showUsage: false,
  skipComponentsWithoutExample: true,
  // getComponentPathLine,
  // sections: [
  //   {
  //     name: 'Shared Atoms',
  //     components: componentsGlob('./app/javascript/ui/shared/components/atoms'),
  //   },
  //   {
  //     name: 'Shared Molecules',
  //     components: componentsGlob(
  //       './app/javascript/ui/shared/components/molecules'
  //     ),
  //   },
  // ],
  components: 'app/javascript/ui/global/**/[A-Z]*.js',
  ignore: [
    '**/__tests__/**',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}',
    '**/*.d.ts',
    'app/javascript/ui/shared/**/*',
  ],
  // propsParser: reactDocgenTypescript.withDefaultConfig({
  //   propFilter: { skipPropsWithoutDoc: false },
  // }).parse,
  // resolver: reactDocgen.resolver.findAllComponentDefinitions,
  // styleguideComponents: {
  //   Wrapper: path.join(__dirname, 'styleguidist/components/ThemeWrapper'),
  // },
  require: [
    '!style-loader!css-loader!sass-loader!./app/assets/stylesheets/global.scss',
  ],
  serverPort: 8080,
  webpackConfig,
}
