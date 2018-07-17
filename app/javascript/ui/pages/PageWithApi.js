import _ from 'lodash'
import { action, observable } from 'mobx'
import { animateScroll as scroll } from 'react-scroll'
import trackError from '~/utils/trackError'

// import { uiStore, routingStore } from '~/stores'

// used as an "interface" class for CollectionPage / ItemPage / SearchPage
// NOTE: extending classes is not a recommended React approach, could consider refactoring to HOC
class PageWithApi extends React.Component {
  unmounted = false
  @observable error = null

  componentDidMount() {
    const { uiStore } = this.props
    scroll.scrollToTop({ duration: 0 })
    uiStore.resetSelectionAndBCT()
    uiStore.update('textEditingItem', null)

    // this will get called on initial render
    if (this.checkOrg(this.props)) {
      this.fetchData(this.props)
    }
  }

  componentWillReceiveProps(nextProps) {
    // this will get called e.g. if you switch between CollectionPages
    // (component does not "re-mount" between routes, but the props change)
    if (this.checkOrg(nextProps)) {
      this.fetchData(nextProps)
    }
  }

  componentWillUnmount() {
    const { uiStore } = this.props
    this.unmounted = true
    uiStore.setViewingCollection(null)
  }

  @action updateError(err) {
    this.error = err
  }

  checkOrg = ({ match, apiStore, routingStore }) => {
    const path = `${routingStore.location.pathname}${routingStore.location.search}`
    if (
      match.path !== '/' &&
      match.path !== '/:org' &&
      !match.path.match(/^(\/:org)?\/search/ig) &&
      !match.path.match(/^\/collections|items/ig)
    ) {
      // escape if we're not on homepage, search, or /collections/items
      return true
    }
    if (!match.params.org) {
      routingStore.routeTo(`/${apiStore.currentOrgSlug}${path}`)
      return false
    } else if (match.params.org !== apiStore.currentOrgSlug) {
      apiStore.currentUser.switchOrganization(
        match.params.org, { redirectPath: path }
      )
      return false
    }
    return true
  }

  // to be overridden in child class
  // onAPILoad = null
  // requestPath = null

  fetchData = (props) => {
    if (!_.isFunction(this.requestPath)) return null
    const { apiStore, uiStore } = props
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
        trackError(err, { name: 'PageApiFetch' })
      })
  }
}

export default PageWithApi
