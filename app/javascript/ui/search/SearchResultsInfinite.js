import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import InfiniteScroll from 'react-infinite-scroller'
import FlipMove from 'react-flip-move'

import Loader from '~/ui/layout/Loader'
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
StyledSearchResult.displayName = 'StyledSearchResult'

@observer
class SearchResultsInfinite extends React.Component {
  routeToCollection = id => () => {
    this.props.routeTo('collections', id)
  }

  render() {
    const {
      searchResults,
      gridSettings,
      gridMaxW,
      hasMore,
      loadMore,
    } = this.props

    const results = (
      searchResults.map((collection) => (
        <FlipMove
          appearAnimation="elevator"
          key={collection.id}
        >
          <StyledSearchResult
            {...gridSettings}
            gridMaxW={gridMaxW}
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
        </FlipMove>
      ))
    )
    return (
      <InfiniteScroll
        useWindow
        // px from bottom
        threshold={200}
        loader={<Loader height={'200px'} key="loader" />}
        loadMore={loadMore}
        pageStart={1}
        hasMore={hasMore}
      >
        {results}
      </InfiniteScroll>
    )
  }
}

SearchResultsInfinite.propTypes = {
  searchResults: MobxPropTypes.arrayOrObservableArray.isRequired,
  gridSettings: MobxPropTypes.objectOrObservableObject.isRequired,
  gridMaxW: PropTypes.number.isRequired,
  routeTo: PropTypes.func.isRequired,
  loadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired,
}

export default SearchResultsInfinite
