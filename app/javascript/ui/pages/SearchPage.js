import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import queryString from 'query-string'

import v from '~/utils/variables'
import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import MoveModal from '~/ui/grid/MoveModal'
import PageContainer from '~/ui/layout/PageContainer'
import SearchResultsInfinite from '~/ui/search/SearchResultsInfinite'

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class SearchPage extends PageWithApi {
  @observable searchResults = []
  @observable hasMore = false
  @observable total = 0

  componentDidMount() {
    const { uiStore, routingStore } = this.props
    const query = this.searchQuery(this.props)
    if (!query) {
      routingStore.leaveSearch()
      return
    }
    // initialize SearchBar to the queryString, e.g. when directly loading a search URL
    uiStore.update('searchText', query)
    super.componentDidMount()
  }

  @action componentWillReceiveProps(nextProps) {
    // i.e. you are on SearchPage and perform a new search
    // NOTE: important to do this here to "reset" infinite scroll!
    if (this.searchQuery(nextProps) !== this.searchQuery(this.props)) {
      this.searchResults.replace([])
    }
    super.componentWillReceiveProps(nextProps)
  }

  componentWillUnmount() {
    const { uiStore } = this.props
    uiStore.update('searchText', '')
  }

  searchQuery = (props, opts = {}) => {
    let query = queryString.parse(props.location.search).q
    if (!query) return ''
    if (opts.url) query = query.replace(/\s/g, '+').replace(/#/g, '%23')
    return query
  }

  requestPath = (props) => {
    const q = this.searchQuery(props, { url: true })
    const page = props.page || 1
    return `search?query=${q}&page=${page}`
  }

  @action onAPILoad = ({ data: results, meta }) => {
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
      this.hasMore = (meta.total > this.searchResults.length)
      this.total = meta.total
    }
  }

  handleInfiniteLoad = (page) => {
    // for some reason it seems to trigger one extra page even when !hasMore
    if (!this.hasMore) return
    this.fetchData({ ...this.props, page })
  }

  renderSearchResults = () => {
    const { uiStore, routingStore } = this.props
    if (this.searchResults.length === 0) {
      if (uiStore.isLoading) {
        return <Loader />
      }
      return <div>No results found for &quot;{this.searchQuery(this.props)}&quot;.</div>
    }

    return (
      <SearchResultsInfinite
        routeTo={routingStore.routeTo}
        gridSettings={uiStore.gridSettings}
        gridMaxW={uiStore.gridMaxW}
        searchResults={this.searchResults}
        loadMore={this.handleInfiniteLoad}
        hasMore={this.hasMore}
        total={this.total}
      />
    )
  }

  render() {
    return (
      <Fragment>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          {this.renderSearchResults()}
          <MoveModal />
        </PageContainer>
      </Fragment>
    )
  }
}

SearchPage.propTypes = {
  match: ReactRouterPropTypes.location.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
}
SearchPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchPage
