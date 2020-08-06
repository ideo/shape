import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observable, computed, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import CollectionViewToggle from '~/ui/grid/CollectionViewToggle'
import CollectionList from '~/ui/grid/CollectionList'
import { DisplayText, DisplayTextCss } from '~/ui/global/styled/typography'
import EditableName from '~/ui/pages/shared/EditableName'
import PageSeparator from '~/ui/global/PageSeparator'
import SearchIconRight from '~/ui/icons/SearchIconRight'
import Loader from '~/ui/layout/Loader'

const SearchIconWrapper = styled.div`
  width: 15px;
  height: 15px;
  margin-right: 10px;
`

const CollectionPillHolder = styled.div`
  margin-bottom: 8px;
  width: 100%;
`

@inject('uiStore')
@observer
class SearchCollection extends React.Component {
  @observable
  loading = false

  componentDidMount() {
    this.loadSearchedCards()
  }

  get searchCollectionCards() {
    const { collection } = this.props
    return collection.searchResultsCollection
      ? collection.searchResultsCollection.collection_cards
      : []
  }

  @computed
  get searchCardProperties() {
    if (!this.searchCollectionCards) return []
    return this.searchCollectionCards.map(c => _.pick(c, ['id', 'updated_at']))
  }

  // NOTE: this function is already debounced by EditableName
  updateSearchTerm = async term => {
    const { collection } = this.props
    collection.search_term = term
    await collection.patch({
      // cancel sync so that API call doesn't interfere with your <input>
      cancel_sync: true,
    })
    this.loadSearchedCards()
  }

  loadCollectionCards = async ({ page, per_page, rows, cols } = {}) => {
    const { collection } = this.props
    return collection.API_fetchCards({
      page,
      per_page,
      rows,
      cols,
    })
  }

  loadSearchedCards = async ({ page = 1, per_page, rows, cols } = {}) => {
    const { collection } = this.props
    const { searchResultsCollection, search_term } = collection
    if (!search_term) {
      searchResultsCollection.clearCollectionCards()
      return
    }
    if (page === 1) {
      runInAction(() => {
        this.loading = true
      })
    }
    await searchResultsCollection.API_fetchCards({
      searchTerm: search_term,
      page,
      per_page: collection.searchRecordsPerPage,
    })
    runInAction(() => {
      this.loading = false
      if (searchResultsCollection.viewMode === 'list') {
        searchResultsCollection.API_fetchCardRoles()
      }
    })
    return
  }

  renderTop() {
    const { uiStore, collection, trackCollectionUpdated } = this.props
    const { blankContentToolState, gridSettings } = uiStore

    const genericCollectionProps = {
      collection,
      loadCollectionCards: this.loadCollectionCards,
      trackCollectionUpdated,
      blankContentToolState,
      cardProperties: collection.cardProperties,
      collection,
      canEditCollection: collection.can_edit_content,
      movingCardIds: [],
    }

    // TODO: remove this switch between Foamcore and Normal Grid, only needed for now;
    // operating in a hybrid context where search collections may/not be 4WFC
    if (collection.isBoard) {
      return <FoamcoreGrid {...genericCollectionProps} />
    }

    return (
      <CollectionGrid
        {...gridSettings}
        {...genericCollectionProps}
        shouldAddEmptyRow={false}
      />
    )
  }

  render() {
    const { uiStore, collection, trackCollectionUpdated } = this.props
    const { searchResultsCollection } = collection
    if (uiStore.isLoading) {
      return <Loader />
    }

    const searchCollectionSettings = {
      collection: searchResultsCollection,
      loadCollectionCards: this.loadSearchedCards,
    }
    let searchResults = (
      <FoamcoreGrid
        {...searchCollectionSettings}
        trackCollectionUpdated={trackCollectionUpdated}
        cardProperties={this.searchCardProperties}
        canEditCollection={false}
        movingCardIds={[]}
        renderOnly
      />
    )

    if (searchResultsCollection.viewMode === 'list') {
      searchResults = <CollectionList {...searchCollectionSettings} />
    }

    return (
      <div style={{ position: 'relative' }}>
        {this.renderTop()}
        <PageSeparator title={<h3>Search Results</h3>} />
        <Flex justify="space-between">
          <Flex align="center" mb="4px" mt="18px">
            <SearchIconWrapper>
              <SearchIconRight />
            </SearchIconWrapper>
            <EditableName
              name={collection.search_term || ''}
              placeholder={'enter search term'}
              updateNameHandler={this.updateSearchTerm}
              canEdit={collection.can_edit}
              TypographyComponent={DisplayText}
              typographyCss={DisplayTextCss}
              dataCy="SearchCollectionInput"
              fieldName="searchTerm"
              editingMarginTop="0"
            />
          </Flex>
          {!this.loading && (
            <Flex
              ml="auto"
              align="center"
              justify="flex-end"
              style={{ marginBottom: '12px' }}
            >
              <CollectionViewToggle collection={searchResultsCollection} />
              <CollectionFilter
                inSearchCollection
                collection={collection}
                canEdit={collection.canEdit}
              />
            </Flex>
          )}
        </Flex>
        <CollectionPillHolder id="collectionFilterPortal" />
        {this.loading ? (
          <Loader />
        ) : (
          <div style={{ padding: '10px 0 40px' }}>
            {this.searchCollectionCards.length === 0 ? (
              <DisplayText data-cy="SearchCollectionEmptyMessage">
                Enter search criteria to populate this collection
              </DisplayText>
            ) : (
              searchResults
            )}
          </div>
        )}
      </div>
    )
  }
}

SearchCollection.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  trackCollectionUpdated: PropTypes.func.isRequired,
}
SearchCollection.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
SearchCollection.defaultProps = {}

export default SearchCollection
