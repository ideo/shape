import { Switch, Route } from 'react-router-dom'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import createBrowserHistory from 'history/createBrowserHistory'

import ErrorBoundary from '~/ui/global/ErrorBoundary'
import MarketingHomepage from '~/ui/pages/MarketingHomepage'
import MarketingProductPage from '~/ui/pages/MarketingProductPage'
import TermsPage from '~/ui/pages/TermsPage'
import CaptureUtmParams from '~/utils/googleAnalytics/CaptureUtmParams'
import v from '~/utils/variables'

export const browserHistory = createBrowserHistory()

class MarketingRoutes extends React.Component {
  theme = createMuiTheme({
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

  render() {
    return (
      <ErrorBoundary>
        <CaptureUtmParams />
        <MuiThemeProvider theme={this.theme}>
          <Switch>
            <Route exact path="/" component={MarketingHomepage} />
            <Route exact path="/terms" component={TermsPage} />
            <Route path="/product/:page" component={MarketingProductPage} />
          </Switch>
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}

export default MarketingRoutes
