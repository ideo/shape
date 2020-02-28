import Cookies from 'js-cookie'
import queryString from 'query-string'
import { withRouter } from 'react-router'
import ReactRouterPropTypes from 'react-router-prop-types'

class CaptureGoogleAnalyticsParams extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    console.log('has params', this.hasUtmQueryParams)
    if (this.hasUtmQueryParams) {
      this.storeParams()
    } else if (this.hasStoredParams) {
      console.log('has stored params')
      this.appendParamsToUrl()
    }
  }

  get utmQueryParams() {
    const {
      location: { search },
    } = this.props
    const values = queryString.parse(search)
    // Extract utm parameters we support
    const { utm_source, utm_medium, utm_campaign, utm_content } = values
    return {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
    }
  }

  get hasUtmQueryParams() {
    return Object.values(this.utmQueryParams).some(param => !!param)
  }

  storeParams() {
    // Actually convert to string
    const paramString = queryString.stringify(this.utmQueryParams)
    console.log('store params', paramString)
    Cookies.set('utmParams', paramString, { expires: 7 })
  }

  get hasStoredParams() {
    console.log('cookies value', Cookies.get('utmParams'))
    return !!Cookies.get('utmParams')
  }

  appendParamsToUrl() {
    const paramsQueryString = Cookies.get('utmParams')
    if (!paramsQueryString) return
    // Append params to browser path
    console.log('append', paramsQueryString)
    this.props.history.push({
      pathname: location.pathname,
      search: paramsQueryString,
    })
    // Clear out cookie
    console.log('clear cookie')
    Cookies.remove('utmParams')
  }

  render() {
    return null
  }
}

CaptureGoogleAnalyticsParams.propTypes = {
  location: ReactRouterPropTypes.location.isRequired,
  history: ReactRouterPropTypes.location.isRequired,
}

export default CaptureGoogleAnalyticsParams = withRouter(
  CaptureGoogleAnalyticsParams
)
