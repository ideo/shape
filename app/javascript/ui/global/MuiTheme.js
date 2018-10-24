import { createMuiTheme } from '@material-ui/core/styles'
import { pxToRem } from '~shared/styles/utils'

import v from '~/utils/variables'

export default createMuiTheme({
  typography: {
    // Use the Shape font instead of the default Roboto font.
    fontFamily: v.fonts.sans,
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
  },
  palette: {
    primary: {
      main: v.colors.sirocco,
    },
    secondary: {
      main: v.colors.pacificBlue,
    },
  },
})
