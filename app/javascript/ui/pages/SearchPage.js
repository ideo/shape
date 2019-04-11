import ReactRouterPropTypes from 'react-router-prop-types'
import { Fragment } from 'react'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import queryString from 'query-string'

import Loader from '~/ui/layout/Loader'
import Deactivated from '~/ui/layout/Deactivated'
import MoveModal from '~/ui/grid/MoveModal'
import PageContainer from '~/ui/layout/PageContainer'
import SearchResultsInfinite from '~/ui/search/SearchResultsInfinite'
import checkOrg from '~/ui/pages/shared/checkOrg'

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class SearchPage extends React.Component {
  unmounted = false
  @observable
  searchResults = []
  @observable
  hasMore = false
  @observable
  total = 0

  componentDidMount() {
    const { uiStore, routingStore, location } = this.props
    const query = this.searchQuery(location)
    if (!query) {
      routingStore.leaveSearch()
      return
    }
    // initialize SearchBar to the queryString, e.g. when directly loading a search URL
    uiStore.update('searchText', query)

    this.fetchData()
  }

  @action
  componentDidUpdate(prevProps) {
    const { routingStore, location } = this.props
    if (checkOrg(this.props.match) && this.requiresFetch(prevProps)) {
      // NOTE: important to do this here to "reset" infinite scroll!
      this.searchResults.replace([])
      this.fetchData()
    }
    if (!this.searchQuery(location)) {
      routingStore.leaveSearch()
    }
  }

  componentWillUnmount() {
    const { uiStore } = this.props
    uiStore.update('searchText', '')
    this.unmounted = true
  }

  requiresFetch = prevProps => {
    const { location, match } = this.props
    const { org } = match.params
    if (org && prevProps.match && org !== prevProps.match.params.org) {
      return true
    }
    // i.e. you are on SearchPage and perform a new search
    return this.searchQuery(prevProps.location) !== this.searchQuery(location)
  }

  fetchData = (page = 1) => {
    const { apiStore, uiStore } = this.props
    uiStore.update('pageError', null)
    uiStore.update('isLoading', true)

    return apiStore
      .request(this.requestPath(page))
      .then(res => {
        if (this.unmounted) return
        this.onAPILoad(res)
        uiStore.update('isLoading', false)
      })
      .catch(err => {
        uiStore.update('pageError', err)
        uiStore.update('isLoading', false)
        // trackError(err, { name: 'PageApiFetch' })
      })
  }

  @action
  onAPILoad = ({ data: results, meta }) => {
    if (meta.page === 1) {
      // reset if we are performing a new search starting at page 1
      this.searchResults.replace([])
    }
    if (results.length === 0) {
      this.hasMore = false
      this.total = this.searchResults.length
    } else {
      const newResults = this.searchResults.concat(results)
      this.searchResults.replace(newResults)
      this.hasMore = meta.total > this.searchResults.length
      this.total = meta.total
    }
  }

  searchQuery = (location, opts = {}) => {
    let query = queryString.parse(location.search).q
    if (!query) return ''
    if (opts.url) query = query.replace(/\s/g, '+').replace(/#/g, '%23')
    return query
  }

  requestPath = (page = 1) => {
    const q = this.searchQuery(this.props.location, { url: true })
    return `search?query=${q}&page=${page}`
  }

  handleInfiniteLoad = page => {
    // for some reason it seems to trigger one extra page even when !hasMore
    if (!this.hasMore) return
    this.fetchData(page)
  }

  renderSearchResults = () => {
    const { uiStore, routingStore, location } = this.props
    if (this.searchResults.length === 0) {
      if (uiStore.isLoading) {
        return <Loader />
      }
      return (
        <div>
          No results found for &quot;
          {this.searchQuery(location)}
          &quot;.
        </div>
      )
    }

    return (
      <SearchResultsInfinite
        routeTo={routingStore.routeTo}
        gridSettings={uiStore.gridSettings}
        gridMaxW={uiStore.gridMaxW}
        searchResults={this.searchResults}
        loadMore={this.handleInfiniteLoad}
        hasMore={this.hasMore && !uiStore.isLoading}
        total={this.total}
      />
    )
  }

  render() {
    const { apiStore } = this.props
    if (apiStore.currentOrgIsDeactivated) {
      return <Deactivated />
    }

    return (
      <Fragment>
        <PageContainer>
          {this.renderSearchResults()}
          <MoveModal />
        </PageContainer>
      </Fragment>
    )
  }
}

SearchPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
}
SearchPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchPage
