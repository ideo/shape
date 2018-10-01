import { MuiThemeProvider } from '@material-ui/core/styles'
import * as React from 'react'

import setBaseStyles from '~shared/styles/base'
import theme from '~/ui/theme'
import v from '~/utils/variables'

setBaseStyles(theme, [
  {
    fontFamily: v.fonts.sans,
  },
  {
    fontFamily: v.fonts.serif,
  },
])

const ThemeWrapper: React.SFC<{}> = props => (
  <MuiThemeProvider theme={theme}>{props.children}</MuiThemeProvider>
)

export default ThemeWrapper
