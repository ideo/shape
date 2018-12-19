// import _ from 'lodash'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { animateScroll as scroll } from 'react-scroll'

import PageError from '~/ui/global/PageError'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import trackError from '~/utils/trackError'

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class PageWithApiWrapper extends React.Component {
  unmounted = false

  state = {
    data: null,
  }

  componentDidMount() {
    const { fetchType, apiStore, uiStore } = this.props
    const { fetchId } = this
    scroll.scrollToTop({ duration: 0 })
    uiStore.resetSelectionAndBCT()
    uiStore.update('textEditingItem', null)

    if (fetchType && fetchId) {
      const data = apiStore.find(fetchType, fetchId)
      if (data) {
        this.setState({ data })
      }
    }
    this.fetchData()
  }

  componentDidUpdate(prevProps) {
    if (this.checkOrg() && this.requiresFetch(prevProps)) {
      this.fetchData()
    }
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  get fetchId() {
    const { fetchId, apiStore, match } = this.props
    return fetchId(apiStore, match.params.id)
  }

  requiresFetch = ({ location: prevLocation, match: prevMatch }) => {
    const { match, location } = this.props
    const { fetchId } = this
    const { data } = this.state
    if (data && data.id && fetchId && data.id !== fetchId) {
      // e.g. for My Collection, but switching orgs
      return true
    }
    // check if URL and search params have actually changed
    if (
      prevMatch &&
      prevMatch.url === match.url &&
      prevLocation &&
      prevLocation.search === location.search
    ) {
      // if no change, then no need to re-fetch data
      return false
    }
    return true
  }

  checkOrg = () => {
    const { match, apiStore, routingStore } = this.props
    const { org } = match.params
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
    if (!org) {
      routingStore.routeTo(`/${apiStore.currentOrgSlug}${path}`)
      return false
    } else if (org !== apiStore.currentOrgSlug) {
      // remove any "wrong" org from the path
      if (match.path.indexOf('/:org') === 0) {
        path = path.replace(/^(\/[\w-]*)/, '') || 'homepage'
      }
      apiStore.currentUser.switchOrganization(org, {
        redirectPath: path,
      })
      return false
    }
    return true
  }

  fetchData = () => {
    const { apiStore, uiStore, fetchType } = this.props
    uiStore.update('pageError', null)

    return apiStore
      .request(`${fetchType}/${this.fetchId}`)
      .then(res => {
        if (this.unmounted) return
        this.setState({ data: res.data })
      })
      .catch(err => {
        uiStore.update('pageError', err)
        trackError(err, { name: 'PageApiFetch' })
      })
  }

  render() {
    const { uiStore } = this.props
    const { data } = this.state
    if (uiStore.pageError) return <PageError error={uiStore.pageError} />
    if (!data) return ''

    return this.props.render(data)
  }
}

PageWithApiWrapper.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
  render: PropTypes.func.isRequired,
  // requestPath: PropTypes.string.isRequired,
  fetchType: PropTypes.string.isRequired,
  fetchId: PropTypes.func,
}
PageWithApiWrapper.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
PageWithApiWrapper.defaultProps = {
  fetchId: (apiStore, routeId) => routeId,
}
export default PageWithApiWrapper

export const CollectionApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="collections"
    render={collection => <CollectionPage collection={collection} />}
  />
)

export const MyCollectionApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="collections"
    fetchId={apiStore => apiStore.currentUserCollectionId}
    render={collection => <CollectionPage collection={collection} isHomepage />}
  />
)

export const ItemApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="items"
    render={item => <ItemPage item={item} />}
  />
)
