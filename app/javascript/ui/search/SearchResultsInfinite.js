import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import InfiniteScroll from 'react-infinite-scroller'
import FlipMove from 'react-flip-move'
import VisibilitySensor from 'react-visibility-sensor'

import { uiStore } from '~/stores'
import v from '~/utils/variables'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import Loader from '~/ui/layout/Loader'
import ActionMenu from '~/ui/grid/ActionMenu'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import CollectionCover from '~/ui/grid/covers/CollectionCover'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import GridCard from '~/ui/grid/GridCard'
import { StyledTopRightActions, StyledBottomLeftIcon } from '~/ui/grid/shared'
import { compact } from 'lodash'

const StyledSearchResult = styled.div`
  width: ${({ width }) => uiStore.gridWidthFor(width)}px;
  height: ${({ height, gridH }) =>
    height ? uiStore.gridHeightFor(height) : gridH}px;
  max-width: ${props => props.gridMaxW}px;
  background: transparent;
  margin-bottom: ${props => props.gutter}px;
  position: relative;
  cursor: pointer;
`
StyledSearchResult.displayName = 'StyledSearchResult'

const StyledBreadcrumb = styled.div`
  margin-top: 16px;
  margin-bottom: 1px;
`

const StyledScrollIndicator = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  color: white;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  text-align: center;
  line-height: 3.5rem;
  background: ${props =>
    props.active ? v.colors.commonMedium : v.colors.commonDark};
  z-index: ${v.zIndex.scrollIndicator};
`

const isCollection = result => result.internalType === 'collections'

@observer
class SearchResultsInfinite extends React.Component {
  visibleItems = observable.map({})
  @observable
  firstVisible = 1
  @observable
  hovering = false

  routeToCollection = id => () => {
    this.props.routeTo('collections', id)
  }

  routeToItem = id => () => {
    this.props.routeTo('items', id)
  }

  @action
  markFirstVisible = index => {
    this.firstVisible = index
  }

  @action
  setVisible = (index, isVisible) => this.visibleItems.set(index, isVisible)

  @action
  setHovering = val => (this.hovering = val)

  computeFirstVisible() {
    let first = 0
    this.visibleItems.forEach((isVisible, idx) => {
      if (isVisible && !first) {
        first = idx
      }
    })
    this.markFirstVisible(first)
  }

  openMenu = cardId => () => {
    uiStore.openCardMenu(cardId)
  }

  closeMenu = () => {
    uiStore.closeCardMenu()
  }

  handleVisibilityChange = index => isVisible => {
    this.setVisible(index, isVisible)
    this.computeFirstVisible()
  }

  handleMouseOver = (index, enter = true) => ev => {
    if (enter) {
      this.setHovering(true)
      this.markFirstVisible(index)
    } else {
      this.setHovering(false)
      this.computeFirstVisible()
    }
  }

  render() {
    const {
      searchResults,
      gridSettings,
      gridMaxW,
      hasMore,
      loadMore,
      // total, using filtered length because of hidden text items
    } = this.props

    const results = searchResults.map((result, i) => {
      // ActionMenu is rendered as if we were operating on the parent_collection_card
      let card = result.parent_collection_card
      if (!card) {
        // catch for special/global templates that don't have a parent card
        card = {
          id: `card-${i}`,
          width: 1,
          height: 1,
        }
      }
      // need to make this available in the reverse direction
      card.record = result

      return (
        <FlipMove appearAnimation="fade" key={result.id}>
          <VisibilitySensor
            partialVisibility
            scrollCheck
            intervalDelay={300}
            onChange={this.handleVisibilityChange(i + 1)}
            offset={{
              top: v.headerHeightCompact + gridSettings.gridH / 2,
            }}
          >
            <div>
              <StyledBreadcrumb>
                <Breadcrumb
                  record={result}
                  isHomepage={false}
                  // re-mount every time the record / breadcrumb changes
                  key={`${result.identifier}_${result.breadcrumbSize}`}
                />
              </StyledBreadcrumb>
              <StyledSearchResult
                {...gridSettings}
                {...{
                  width: card.width,
                  height: card.height,
                }}
                gridMaxW={gridMaxW}
                onMouseEnter={this.handleMouseOver(i + 1)}
                onMouseLeave={this.handleMouseOver(i + 1, false)}
              >
                <StyledTopRightActions className="show-on-hover">
                  <SelectionCircle cardId={card.id} />
                  <ActionMenu
                    location="Search"
                    className="show-on-hover"
                    wrapperClassName="card-menu"
                    card={card}
                    canEdit={false}
                    canReplace={false}
                    menuOpen={uiStore.cardMenuOpen.id === card.id}
                    onOpen={this.openMenu(card.id)}
                    onLeave={this.closeMenu}
                  />
                </StyledTopRightActions>
                {isCollection(result) ? (
                  <Fragment>
                    <StyledBottomLeftIcon>
                      <CollectionIcon />
                    </StyledBottomLeftIcon>
                    <CollectionCover
                      onClick={this.routeToCollection(result.id)}
                      collection={result}
                      width={card.maxWidth || card.width}
                      height={card.maxHeight || card.height}
                    />
                  </Fragment>
                ) : (
                  <GridCard
                    card={card}
                    cardType={result.internalType}
                    record={result}
                    cardId={card.id}
                    menuOpen={false}
                    // NOTE: this will have to get modified when we eventually
                    // turn off item routing for videos and images
                    handleClick={this.routeToItem(result.id)}
                    searchResult
                  />
                )}
              </StyledSearchResult>
            </div>
          </VisibilitySensor>
        </FlipMove>
      )
    })

    const filteredResults = compact(results)

    return (
      <Fragment>
        <StyledScrollIndicator active={this.hovering}>
          {this.firstVisible}/{filteredResults.length}
        </StyledScrollIndicator>
        <InfiniteScroll
          useWindow
          pageStart={1}
          threshold={200} // px from bottom
          loader={<Loader height={'200px'} key="loader" />}
          loadMore={loadMore}
          hasMore={hasMore}
        >
          {filteredResults}
        </InfiniteScroll>
      </Fragment>
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
  total: PropTypes.number.isRequired,
}

export default SearchResultsInfinite
