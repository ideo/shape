import _ from 'lodash'
import { action, observable } from 'mobx'
import { animateScroll as scroll } from 'react-scroll'
import trackError from '~/utils/trackError'

// used as an "interface" class for CollectionPage / ItemPage / SearchPage
// NOTE: extending classes is not a recommended React approach, could consider refactoring to HOC
class PageWithApi extends React.Component {
  unmounted = false
  @observable
  error = null

  componentDidMount() {
    // eslint-disable-next-line react/prop-types
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
    if (this.checkOrg(nextProps) && this.requiresFetch(nextProps)) {
      this.fetchData(nextProps)
    }
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  @action
  updateError(err) {
    this.error = err
  }

  requiresFetch = ({ location, match }) => {
    const prevProps = { ...this.props }
    const prevMatch = prevProps.match || {}
    const prevLocation = prevProps.location || {}
    // check if URL and search params have actually changed
    if (
      prevMatch.url === match.url &&
      prevLocation.search === location.search
    ) {
      // if no change, then no need to re-fetch data
      return false
    }
    return true
  }

  checkOrg = ({ match, apiStore, routingStore }) => {
    let path = `${routingStore.location.pathname}${
      routingStore.location.search
    }`
    if (
      match.path !== '/' &&
      match.path !== '/:org' &&
      !match.path.match(/^(\/:org)?\/search/gi) &&
      !match.path.match(/^\/collections|items/gi)
    ) {
      // escape if we're not on homepage, search, or /collections/items
      return true
    }
    if (match.path !== '/' && !apiStore.currentOrgSlug) {
      // no org available, e.g. we need to set up a new org
      routingStore.routeTo('/')
      return false
    }
    if (!match.params.org) {
      routingStore.routeTo(`/${apiStore.currentOrgSlug}${path}`)
      return false
    } else if (match.params.org !== apiStore.currentOrgSlug) {
      // remove any "wrong" org from the path
      if (match.path.indexOf('/:org') === 0) {
        path = path.replace(/^(\/[\w-]*)/, '') || 'homepage'
      }
      apiStore.currentUser.switchOrganization(match.params.org, {
        redirectPath: path,
      })
      return false
    }
    return true
  }

  // to be overridden in child class
  // onAPILoad = null
  // requestPath = null

  fetchData = props => {
    if (!_.isFunction(this.requestPath)) return null
    const { apiStore, uiStore } = props
    uiStore.update('isLoading', true)
    return apiStore
      .request(this.requestPath(props))
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
