import { Switch, Route } from 'react-router-dom'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import ErrorBoundary from '~/ui/global/ErrorBoundary'
// import MarketingPage from '~/ui/pages/MarketingPage'
import ProductTemplatesPage from '~/ui/pages/ProductTemplatesPage'
// import ProductFeedbackPage from '~/ui/pages/ProductFeedbackPage'
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
            <Route exact path="/" component={ProductTemplatesPage} />
            <Route exact path="/terms" component={TermsPage} />
            {/* work in progress
              <Route exact path="/product/templates" component={ProductTemplatesPage} />
              <Route exact path="/product/feedback" component={ProductFeedbackPage} />
            */}
          </Switch>
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}

export default MarketingRoutes
