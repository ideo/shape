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
import { StyledBottomLeftIcon } from '~/ui/grid/GridCard'

const StyledSearchResult = styled.div`
  height: ${props => props.gridH}px;
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

  @action onAPILoad = (results) => {
    this.searchResults = results
  }

  routeToCollection = id => () => {
    this.props.routingStore.routeTo('collections', id)
  }

  renderSearchResults = () => {
    const { gridH, gutter } = this.props.uiStore.gridSettings
    const gridProps = { gridH, gutter }
    if (this.props.uiStore.isLoading) {
      return <Loader />
    }
    if (this.searchResults.length === 0) {
      return <div>No results found for &quot;{this.searchQuery(this.props)}&quot;.</div>
    }
    return (
      this.searchResults.map((collection) => (
        <StyledSearchResult
          {...gridProps}
          onClick={this.routeToCollection(collection.id)}
          key={collection.id}
        >
          <CollectionCover collection={collection} />
          <StyledBottomLeftIcon>
            <CollectionIcon />
          </StyledBottomLeftIcon>
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
