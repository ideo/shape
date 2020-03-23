import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { getStoredUtmParams, deleteUtmParams } from './utmUtils'

@inject('routingStore')
@observer
class AppendUtmParams extends React.Component {
  componentDidMount() {
    if (!this.urlHasUtmQueryParams && this.hasStoredParams) {
      this.appendParamsToUrl()
    }
  }

  get urlHasUtmQueryParams() {
    const { utmQueryParams } = this.props.routingStore
    return Object.values(utmQueryParams).some(param => !!param)
  }

  get hasStoredParams() {
    return !!getStoredUtmParams()
  }

  appendParamsToUrl() {
    const { appendQueryString } = this.props.routingStore
    const paramsQueryString = getStoredUtmParams()
    if (!paramsQueryString) return
    if (appendQueryString(paramsQueryString)) {
      // Clear out cookie so we don't render utm params again
      deleteUtmParams()
    }
  }

  render() {
    return null
  }
}

AppendUtmParams.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AppendUtmParams
