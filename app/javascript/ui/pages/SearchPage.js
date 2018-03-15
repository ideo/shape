import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import queryString from 'query-string'
import styled from 'styled-components'

import v from '~/utils/variables'
import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionCover from '~/ui/grid/covers/CollectionCover'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import { StyledTopRightActions, StyledBottomLeftIcon } from '~/ui/grid/GridCard'

const StyledSearchResult = styled.div`
  height: ${props => props.gridH}px;
  max-width: ${props => props.gridMaxW}px;
  background: white;
  margin-bottom: ${props => props.gutter}px;
  position: relative;
  cursor: pointer;
`

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class SearchPage extends PageWithApi {
  @observable searchResults = []

  searchQuery = (props) => (
    queryString.parse(props.location.search).q
  )

  requestPath = (props) => (
    `search?query=${this.searchQuery(props).replace(/\s/g, '+')}`
  )

  @action onAPILoad = (results, meta) => {
    this.searchResults = results
  }

  routeToCollection = id => () => {
    this.props.routingStore.routeTo('collections', id)
  }

  renderSearchResults = () => {
    const { uiStore } = this.props
    if (uiStore.isLoading) {
      return <Loader />
    }
    if (this.searchResults.length === 0) {
      return <div>No results found for &quot;{this.searchQuery(this.props)}&quot;.</div>
    }
    return (
      this.searchResults.map((collection) => (
        <StyledSearchResult
          {...uiStore.gridSettings}
          gridMaxW={uiStore.gridMaxW}
          key={collection.id}
          onClick={this.routeToCollection(collection.id)}
        >
          <StyledTopRightActions className="show-on-hover">
            {/* NOTE: once linking is enabled, should setup CardMenu here */}
          </StyledTopRightActions>
          <StyledBottomLeftIcon>
            <CollectionIcon />
          </StyledBottomLeftIcon>
          <CollectionCover collection={collection} />
        </StyledSearchResult>
      ))
    )
  }

  render() {
    return (
      <Fragment>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          {this.renderSearchResults()}
        </PageContainer>
      </Fragment>
    )
  }
}

SearchPage.propTypes = {
  location: ReactRouterPropTypes.location.isRequired,
}
SearchPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchPage
