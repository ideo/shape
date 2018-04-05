import _ from 'lodash'
import { animateScroll as scroll } from 'react-scroll'

import { uiStore, routingStore } from '~/stores'

class PageWithApi extends React.Component {
  componentDidMount() {
    scroll.scrollToTop({ duration: 0 })
    uiStore.resetSelectionAndBCT()
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
    uiStore.update('loading', true)
    return apiStore.request(this.requestPath(props))
      .then(response => {
        uiStore.update('loading', false)
        if (_.isFunction(this.onAPILoad)) {
          this.onAPILoad(response)
        }
      })
      .catch(err => {
        uiStore.update('loading', false)
        console.warn('API error!', err)
        if (!routingStore.location.pathname === '/') routingStore.routeTo('/')
      })
  }
}

export default PageWithApi
