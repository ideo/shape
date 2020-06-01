import ReactRouterPropTypes from 'react-router-prop-types'
import { Fragment } from 'react'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import queryString from 'query-string'

import Loader from '~/ui/layout/Loader'
import Deactivated from '~/ui/layout/Deactivated'
import GlobalPageComponentsContainer from '~/ui/grid/GlobalPageComponentsContainer'
import PageContainer from '~/ui/layout/PageContainer'
import SearchResultsInfinite from '~/ui/search/SearchResultsInfinite'
import { stringifyUrlParams } from '~/utils/url'

@inject('apiStore', 'uiStore')
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
    const { uiStore, location } = this.props
    const query = this.searchQuery(location)
    // initialize search bar to the queryString, e.g. when directly loading a search URL
    uiStore.update('searchText', '')
    setTimeout(() => {
      uiStore.update('searchText', query)
    }, 5)

    this.fetchData()
  }

  @action
  componentDidUpdate(prevProps) {
    if (this.requiresFetch(prevProps)) {
      // NOTE: important to do this here to "reset" infinite scroll!
      this.searchResults.replace([])
      this.fetchData()
    }
  }

  componentWillUnmount() {
    const { uiStore } = this.props
    uiStore.update('searchText', '')
    this.unmounted = true
  }

  get urlSlug() {
    const { match } = this.props
    return match.params && match.params.org
  }

  requiresFetch = prevProps => {
    const { location, match } = this.props
    const { org } = match.params
    if (org && prevProps.match && org !== prevProps.match.params.org) {
      return true
    }
    // i.e. you are on SearchPage and perform a new search
    return prevProps.location !== location && this.searchQuery(location)
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
    const { apiStore } = this.props
    // this needs to await the fetchData request so that your (potential) org switch is complete
    apiStore.checkCurrentOrg({ slug: this.urlSlug })
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

  searchParams = location => {
    const parsedParams = queryString.parse(location.search)
    const params = parsedParams
    delete params.q
    delete params['']
    if (!params) return {}
    return params
  }

  requestPath = (page = 1) => {
    const q = this.searchQuery(this.props.location, { url: true })
    const params = stringifyUrlParams(this.searchParams(this.props.location))
    return `organizations/${this.urlSlug}/search?query=${q}&page=${page}&${params}`
  }

  handleInfiniteLoad = page => {
    // for some reason it seems to trigger one extra page even when !hasMore
    if (!this.hasMore) return
    this.fetchData(page)
  }

  renderSearchResults = () => {
    const { uiStore, location } = this.props
    const query = this.searchQuery(location)
    if (!query) {
      return null
    }
    if (this.searchResults.length === 0) {
      // don't override the whole search with a loader unless we know nothing has loaded yet,
      // e.g. for pagination
      if (uiStore.isLoading) {
        return <Loader />
      }
      return (
        <div>
          No results found for &quot;
          {query}
          &quot;.
        </div>
      )
    }

    return (
      <SearchResultsInfinite
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
        <PageContainer marginTop={40}>
          {this.renderSearchResults()}
          <GlobalPageComponentsContainer />
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
}

export default SearchPage
