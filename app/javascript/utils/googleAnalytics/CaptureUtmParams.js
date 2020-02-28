import ReactRouterPropTypes from 'react-router-prop-types'
import { withRouter } from 'react-router'

import { storeUtmParams, utmParamsFromLocation } from './utmUtils'

class CaptureUtmParams extends React.Component {
  componentDidMount() {
    this.storeUtmQueryParamsFromUrl()
  }

  storeUtmQueryParamsFromUrl() {
    const { location } = this.props
    storeUtmParams(utmParamsFromLocation(location))
  }

  render() {
    return null
  }
}

CaptureUtmParams.propTypes = {
  location: ReactRouterPropTypes.location.isRequired,
}

export { CaptureUtmParams }

const WrappedCaptureUtmParams = withRouter(CaptureUtmParams)

export default WrappedCaptureUtmParams
