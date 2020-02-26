import Cookies from 'js-cookie'
import queryString from 'query-string'

class CaptureGoogleAnalyticsParams extends React.PureComponent {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    if (this.hasUtmQueryParams()) {
      this.storeParams()
    } else {
    }
  }

  utmQueryParams() {
    // const {
    //   location: { search },
    // } = this.props.location.search
    const search = ''
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

  hasUtmQueryParams() {
    return this.utmQueryParams().keys.some(param => !!param)
  }

  storeParams() {
    // Actually convert to string
    const paramString = this.utmQueryParams().toString()
    Cookies.set('utmParams', paramString, { expires: 7 })
  }

  appendParams() {
    const params = Cookies.get('utmParams')
    if (!params) return
    // Extract params from string
    // Append params to browser path
  }
}

CaptureGoogleAnalyticsParams.propTypes = {}

export default CaptureGoogleAnalyticsParams
