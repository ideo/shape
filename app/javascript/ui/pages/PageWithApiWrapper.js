import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { action, computed, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { animateScroll as scroll } from 'react-scroll'

import PageError from '~/ui/global/PageError'
import Deactivated from '~/ui/layout/Deactivated'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import trackError from '~/utils/trackError'
import _ from 'lodash'
import googleTagManager from '~/vendor/googleTagManager'

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class PageWithApiWrapper extends React.Component {
  unmounted = false

  @observable
  record = null
  @observable
  pathRequested = ''

  @action
  componentDidMount() {
    const { uiStore } = this.props
    scroll.scrollToTop({ duration: 0 })
    uiStore.resetSelectionAndBCT()
    uiStore.clearTextEditingCard()

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

  @action
  setRecord(data) {
    this.record = data
  }

  @action
  setPathRequested(path) {
    this.pathRequested = path
  }

  get isMyCollectionPath() {
    // root path where the URL is just /:org
    const { id, org } = this.props.match.params
    if (!id && org) {
      return true
    }
  }

  @computed
  get fetchId() {
    const { id } = this.props.match.params
    if (!id) return null
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
      return `organizations/${match.params.org}/my_collection?page_view=true`
    }
    return `${fetchType}/${this.fetchId}?page_view=true`
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

  trackPageView(record) {
    const { type, isCollection, isMasterTemplate } = record

    googleTagManager.push({
      event: 'pageView',
      timestamp: new Date().toUTCString(),
      objectType: type,
      isMasterTemplate: (isCollection && isMasterTemplate) || false,
    })
  }

  @action
  fetchData = () => {
    const { apiStore, uiStore, routingStore, match, fetchType } = this.props
    const { requestPath, cachedFetchId } = this

    uiStore.update('pageError', null)
    uiStore.setBodyBackgroundImage(null)
    uiStore.setBodyFontColor(null)
    uiStore.update('isTransparentLoading', true)

    if (fetchType && cachedFetchId) {
      // First check if we already have this record in the local store
      const record = apiStore.find(fetchType, cachedFetchId)
      // 4WFC migration related... we treat non-board collections as needing full fetch
      const needsMigration = record && record.isCollection && !record.isBoard
      if (
        record &&
        !record.isText &&
        !record.awaiting_updates &&
        !record.isTestCollection &&
        !needsMigration
      ) {
        // mark as !fullyLoaded until we re-fetch the latest data
        // (mostly just used by RealtimeTextItem)
        record.updateFullyLoaded(false)
        this.setRecord(record)
        record.setCollaborators([])
      }
    }

    this.setPathRequested(requestPath)

    apiStore
      .request(requestPath)
      .then(res => this.afterFetchData(res, requestPath))
      .catch(err => {
        this.setRecord(null)
        if (!apiStore.currentUser && err.status === 401) {
          // always redirect logged-out users to login
          routingStore.routeToLogin({ redirect: match.url })
          return
        }
        uiStore.update('pageError', err)
        trackError(err, { name: 'PageApiFetch' })
      })
  }

  @action
  afterFetchData = (res, requestPath) => {
    if (this.unmounted) return

    const { uiStore, match } = this.props
    const record = res.data
    const { id } = match.params

    if (id && id.toString() === this.fetchId && _.isString(record.name)) {
      const name = record.name.replace(/[^\x00-\x7F]/g, '')
      // Update URL so collections and items have slug with id and name
      history.replaceState(
        // state object
        {},
        // title: ignored by some browsers
        name,
        // URL, stripping non-ASCII characters
        `${record.id}-${_.kebabCase(name)}`
      )
    }

    record.updateFullyLoaded(true)
    uiStore.update('isTransparentLoading', false)
    uiStore.update('isRouting', false)
    // url could be null which will reset it
    uiStore.setBodyBackgroundImage(record.backgroundImageUrl)
    uiStore.setBodyFontColor(record.fontColor)
    // We may be in the callback of a request that we've since left (e.g. navigating multiple pages quickly),
    // so only set this.record if we're returning from our current matching request
    // -- could also abort past requests? https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    if (requestPath === this.pathRequested) {
      this.setRecord(record)
    }
    const { parent_collection_card } = record
    if (parent_collection_card && !parent_collection_card.record) {
      // set this relationship in the other direction
      parent_collection_card.record = record
    }
    this.trackPageView(record)
  }

  render() {
    const { apiStore, uiStore } = this.props
    const { pageError } = uiStore
    const { record } = this
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
    if (!record) {
      return null
    }

    if (this.fetchId && record.id !== this.fetchId) {
      // in this case we are mid-transition to a new record, so no need to render
      return null
    }

    return this.props.render(record)
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
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
PageWithApiWrapper.defaultProps = {
  fetchId: null,
}
export default PageWithApiWrapper

export const CollectionApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="collections"
    render={collection => <CollectionPage collection={collection} />}
  />
)

export const ItemApiWrapper = routerProps => (
  <PageWithApiWrapper
    {...routerProps}
    fetchType="items"
    render={item => <ItemPage item={item} fullyLoaded={item.fullyLoaded} />}
  />
)
