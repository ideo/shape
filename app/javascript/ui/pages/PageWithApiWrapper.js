import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { animateScroll as scroll } from 'react-scroll'

import PageError from '~/ui/global/PageError'
import Deactivated from '~/ui/layout/Deactivated'
import CollectionPage from '~/ui/pages/CollectionPage'
import ItemPage from '~/ui/pages/ItemPage'
import trackError from '~/utils/trackError'
import checkOrg from '~/ui/pages/shared/checkOrg'

@inject('apiStore', 'uiStore')
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
        data.fullyLoaded = false
        this.setState({ data })
      }
    }
    this.fetchData()
  }

  componentDidUpdate(prevProps) {
    if (checkOrg(this.props.match) && this.requiresFetch(prevProps)) {
      this.fetchData()
    }
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  get fetchId() {
    // will use a custom function (passed in prop)
    // or else default to match.params.id
    const { fetchId, apiStore, match } = this.props
    if (!fetchId) return match.params.id
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

  fetchData = async () => {
    const { apiStore, uiStore, fetchType } = this.props
    uiStore.update('pageError', null)

    return apiStore
      .request(`${fetchType}/${this.fetchId}`)
      .then(res => {
        if (this.unmounted) return
        const { data } = res
        this.setState({ data }, () => {
          data.fullyLoaded = true
        })
      })
      .catch(err => {
        uiStore.update('pageError', err)
        trackError(err, { name: 'PageApiFetch' })
      })
  }

  render() {
    const { apiStore, uiStore } = this.props
    const { data } = this.state
    if (apiStore.currentOrgIsDeactivated) {
      return <Deactivated />
    }
    if (uiStore.pageError) {
      return <PageError error={uiStore.pageError} />
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
