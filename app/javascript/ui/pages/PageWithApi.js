import _ from 'lodash'

import { uiStore } from '~/stores'

class PageWithApi extends React.Component {
  componentDidMount() {
    // this will get called on initial render
    this.fetchData(this.props)
  }

  componentWillReceiveProps(nextProps) {
    // this will get called e.g. if you switch between CollectionPages
    // (component does not "re-mount" between routes, but the props change)
    this.fetchData(nextProps)
  }

  // to be overridden in child class
  // onAPILoad = null
  // requestPath = null

  fetchData = (props) => {
    if (!_.isFunction(this.requestPath)) return null
    const { apiStore } = props
    uiStore.loading(true)
    return apiStore.request(this.requestPath(props))
      .then(response => {
        uiStore.loading(false)
        if (_.isFunction(this.onAPILoad)) {
          this.onAPILoad(response.data, response.meta)
        }
      })
      .catch(err => {
        uiStore.loading(false)
        console.log('API error!', err)
      })
  }
}

export default PageWithApi
