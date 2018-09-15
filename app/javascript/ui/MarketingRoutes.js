import { Switch, Route } from 'react-router-dom'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import ErrorBoundary from '~/ui/global/ErrorBoundary'
import MarketingPage from '~/ui/pages/MarketingPage'
import v from '~/utils/variables'

class MarketingRoutes extends React.Component {
  theme = createMuiTheme({
    typography: {
      // Use the Shape font instead of the default Roboto font.
      fontFamily: v.fonts.sans,
    },
    palette: {
      primary: {
        main: v.colors.sirocco,
      },
      secondary: {
        main: v.colors.pacificBlue,
      },
    }
  })

  render() {
    return (
      <ErrorBoundary>
        <MuiThemeProvider theme={this.theme}>
          <Switch>
            <Route exact path="/" component={MarketingPage} />
          </Switch>
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}

export default MarketingRoutes
