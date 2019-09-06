// https://github.com/styled-components/jest-styled-components/issues/256
import { ThemeProvider } from 'styled-components'

export const shallowWithTheme = (tree, theme) => {
  const WrappingThemeProvider = props => (
    <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
  )

  return shallow(tree, { wrappingComponent: WrappingThemeProvider })
}

export const mountWithTheme = (tree, theme) => {
  const WrappingThemeProvider = props => (
    <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
  )

  return mount(tree, { wrappingComponent: WrappingThemeProvider })
}
