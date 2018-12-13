import { createMuiTheme } from '@material-ui/core/styles'
import v from '~/utils/variables'

export default createMuiTheme({
  typography: {
    // https://material-ui.com/style/typography/#migration-to-typography-v2
    useNextVariants: true,
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
  overrides: {
    MuiList: {
      padding: {
        paddingBottom: 0,
        paddingTop: 0,
      },
    },
    MuiPaper: {
      root: {
        borderRadius: '1px !important',
        boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.2) !important',
      },
    },
  },
})
