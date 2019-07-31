import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { animateScroll as scroll } from 'react-scroll'

import PageError from '~/ui/global/PageError'
import Deactivated from '~/ui/layout/Deactivated'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import trackError from '~/utils/trackError'
import routeToLogin from '~/utils/routeToLogin'

@inject('apiStore', 'uiStore')
@observer
class PageWithApiWrapper extends React.Component {
  unmounted = false

  state = {
    data: null,
  }

  componentDidMount() {
    const { fetchType, apiStore, uiStore } = this.props
    const { cachedFetchId } = this
    scroll.scrollToTop({ duration: 0 })
    uiStore.resetSelectionAndBCT()
    uiStore.update('textEditingItem', null)

    if (fetchType && cachedFetchId) {
      // First check if we already have this record in the local store
      const data = apiStore.find(fetchType, cachedFetchId)
      if (data) {
        // mark as !fullyLoaded until we re-fetch the latest data
        data.fullyLoaded = false
        this.setState({ data })
      }
    }
    // fetch the data from the API
    this.fetchData()
  }

  componentDidUpdate(prevProps) {
    if (this.requiresFetch(prevProps)) {
      this.fetchData()
    }
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  get isMyCollectionPath() {
    // root path where the URL is just /:org
    const { id, org } = this.props.match.params
    if (!id && org) {
      return true
    }
  }

  get fetchId() {
    const { id } = this.props.match.params
    // strip non-numeric characters from id
    return parseInt(id).toString()
  }

  get cachedFetchId() {
    const { apiStore, match } = this.props
    const { org } = match.params
    const { currentOrgSlug, currentUserCollectionId } = apiStore
    if (this.isMyCollectionPath) {
      // loading /org means trying to load My Collection for that org
      if (currentOrgSlug === org) {
        return currentUserCollectionId
      } else {
        return false
      }
    }
    return this.fetchId
  }

  get requestPath() {
    const { fetchType, match } = this.props
    if (this.isMyCollectionPath) {
      return `organizations/${match.params.org}/my_collection`
    }
    return `${fetchType}/${this.fetchId}`
  }

  requiresFetch = ({ location: prevLocation, match: prevMatch }) => {
    const { match, location } = this.props
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

  fetchData = async () => {
    const { apiStore, uiStore, match } = this.props
    uiStore.update('pageError', null)

    return apiStore
      .request(this.requestPath)
      .then(res => {
        if (this.unmounted) return
        const { data } = res
        const { id } = match.params

        if (id && id.toString() === this.fetchId) {
          // Update URL so collections and items have slug with id and name
          history.replaceState(
            {},
            data.name,
            `${data.id}-${_.kebabCase(data.name)}`
          )
        }
        data.fullyLoaded = true
        this.setState({ data })
      })
      .catch(err => {
        this.setState({ data: null }, () => {
          if (!apiStore.currentUser && err.status === 401) {
            // always redirect logged-out users to login
            routeToLogin({ redirect: match.url })
          }
          uiStore.update('pageError', err)
          trackError(err, { name: 'PageApiFetch' })
        })
      })
  }

  render() {
    const { apiStore, uiStore } = this.props
    const { pageError } = uiStore
    const { data } = this.state
    if (
      apiStore.currentOrgIsDeactivated &&
      pageError &&
      pageError.status === 404
    ) {
      return <Deactivated />
    }
    if (pageError) {
      return <PageError error={pageError} />
    }
    if (!data) return ''

    return this.props.render(data)
  }
}

PageWithApiWrapper.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
  render: PropTypes.func.isRequired,
  fetchType: PropTypes.string.isRequired,
  fetchId: PropTypes.func,
}
PageWithApiWrapper.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
PageWithApiWrapper.defaultProps = {
  fetchId: null,
}
export default PageWithApiWrapper

export const CollectionApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="collections"
    render={collection => (
      <CollectionPage {...routerProps} collection={collection} />
    )}
  />
)

export const ItemApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="items"
    render={item => <ItemPage item={item} fullyLoaded={item.fullyLoaded} />}
  />
)
