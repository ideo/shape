import _ from 'lodash'
import { action, observable } from 'mobx'
import { animateScroll as scroll } from 'react-scroll'

import { uiStore, routingStore } from '~/stores'

// used as an "interface" class for CollectionPage / ItemPage / SearchPage
// NOTE: extending classes is not a recommended React approach, could consider refactoring to HOC
class PageWithApi extends React.Component {
  unmounted = false
  @observable error = null

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

  componentWillUnmount() {
    this.unmounted = true
    uiStore.setViewingCollection(null)
  }

  @action updateError(err) {
    this.error = err
  }

  // to be overridden in child class
  // onAPILoad = null
  // requestPath = null

  fetchData = (props) => {
    if (!_.isFunction(this.requestPath)) return null
    const { apiStore } = props
    uiStore.update('isLoading', true)
    return apiStore.request(this.requestPath(props))
      .then(response => {
        uiStore.update('isLoading', false)
        if (this.unmounted) return
        if (_.isFunction(this.onAPILoad)) {
          this.onAPILoad(response)
        }
      })
      .catch(err => {
        uiStore.update('isLoading', false)
        this.updateError(err)
        console.warn('API error!', err)
        if (!routingStore.location.pathname === '/') routingStore.routeTo('/')
      })
  }
}

export default PageWithApi
