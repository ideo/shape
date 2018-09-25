const path = require('path')
const reactDocgenTypescript = require('react-docgen-typescript')
const reactDocgen = require('react-docgen')

/* eslint-disable-next-line no-unused-vars */
const { devServer, ...webpackConfig } = require('./config/webpack/development')

const componentsGlob = p => path.join(p, '**/*{.js,jsx,ts,tsx}')

const getComponentPathLine = componentPath => {
  const dir = componentPath
    .replace('app/javascript/ui/', '~')
    .replace(/\.(js|ts)x?/, '')

  const name = path.basename(componentPath, '.tsx')

  return `import ${name} from ${dir}`
}
module.exports = {
  title: 'Shape Styleguide',
  showUsage: false,
  skipComponentsWithoutExample: true,
  getComponentPathLine,
  sections: [
    {
      name: 'Shared Atoms',
      components: componentsGlob('./app/javascript/ui/shared/components/atoms'),
    },
    {
      name: 'Shared Molecules',
      components: componentsGlob(
        './app/javascript/ui/shared/components/molecules'
      ),
    },
  ],
  components: [componentsGlob('./app/javascript/ui/')],
  propsParser: reactDocgenTypescript.withDefaultConfig({
    propFilter: { skipPropsWithoutDoc: false },
  }).parse,
  resolver: reactDocgen.resolver.findAllComponentDefinitions,
  styleguideComponents: {
    Wrapper: path.join(__dirname, 'styleguidist/components/ThemeWrapper'),
  },
  webpackConfig,
}
