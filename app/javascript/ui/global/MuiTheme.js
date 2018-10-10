import { createMuiTheme } from '@material-ui/core/styles'

import v from '~/utils/variables'

export default createMuiTheme({
  typography: {
    // Use the Shape font instead of the default Roboto font.
    fontFamily: v.fonts.sans,
  },
  palette: {
    primary: {
      main: v.colors.offset,
    },
    secondary: {
      main: v.colors.ctaPrimary,
    },
  },
})
