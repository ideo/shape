import { Switch, Route } from 'react-router-dom'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import ErrorBoundary from '~/ui/global/ErrorBoundary'
import MarketingPage from '~/ui/pages/MarketingPage'
import TermsPage from '~/ui/pages/TermsPage'
import v from '~/utils/variables'

class MarketingRoutes extends React.Component {
  theme = createMuiTheme({
    typography: {
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
  })

  render() {
    return (
      <ErrorBoundary>
        <MuiThemeProvider theme={this.theme}>
          <Switch>
            <Route exact path="/" component={MarketingPage} />
            <Route exact path="/terms" component={TermsPage} />
          </Switch>
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}

export default MarketingRoutes
