import { createMuiTheme } from '@material-ui/core/styles'
import { pxToRem } from '~shared/styles/utils'

import v from '~/utils/variables'

const billingTypography = {
  body1: {
    fontSize: '1rem',
  },
  // heading-1
  headline: {
    textTransform: 'uppercase',
    fontWeight: 500,
    fontSize: pxToRem(32),
    letterSpacing: pxToRem(1.2),
  },
  // heading-2
  subheading: {
    textTransform: 'uppercase',
    fontWeight: 500,
    fontSize: pxToRem(20),
    letterSpacing: pxToRem(0.5),
  },
  // heading-3
  title: {
    display: 'inline',
    fontSize: pxToRem(14),
    fontWeight: 500,
    textTransform: 'uppercase',
    fontStyle: 'normal',
    fontStretch: 'normal',
    lineHeight: 1.5,
    letterSpacing: pxToRem(0.5),
  },
  // heading-4
  display1: {
    fontSize: pxToRem(16),
    letterSpacing: pxToRem(0.6),
    textTransform: 'none',
  },
  // instructional
  display2: {
    fontSize: pxToRem(14),
    letterSpacing: 'normal',
    lineHeight: pxToRem(18),
  },
  // label
  display3: {
    fontSize: pxToRem(12),
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: pxToRem(0.5),
  },
  // emphasis
  display4: {
    fontSize: pxToRem(48),
    color: 'black',
  },
  // paragraph
  body2: {
    fontSize: pxToRem(16),
  },
}

const theme = {
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
}

const MuiTheme = createMuiTheme(theme)
export default MuiTheme

export const BillingMuiTheme = createMuiTheme({
  ...theme,
  typography: {
    ...theme.typography,
    ...billingTypography,
  },
})
