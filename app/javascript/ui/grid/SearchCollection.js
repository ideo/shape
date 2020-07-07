import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observable, computed, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

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
    })
    return
  }

  render() {
    const { uiStore, collection, trackCollectionUpdated } = this.props
    const { searchResultsCollection } = collection
    const { blankContentToolState, gridSettings } = uiStore
    if (uiStore.isLoading || collection.reloading) {
      return <Loader />
    }

    let searchResults = (
      <CollectionGrid
        {...gridSettings}
        loadCollectionCards={this.loadSearchedCards}
        trackCollectionUpdated={trackCollectionUpdated}
        cardProperties={this.searchCardProperties}
        collection={collection.searchResultsCollection}
        canEditCollection={false}
        movingCardIds={[]}
      />
    )

    if (searchResultsCollection.viewMode === 'list') {
      searchResults = <CollectionList collection={searchResultsCollection} />
    }

    return (
      <div style={{ position: 'relative' }}>
        <CollectionGrid
          {...gridSettings}
          loadCollectionCards={this.loadCollectionCards}
          trackCollectionUpdated={trackCollectionUpdated}
          blankContentToolState={blankContentToolState}
          cardProperties={collection.cardProperties}
          collection={collection}
          canEditCollection={collection.can_edit_content}
          shouldAddEmptyRow={false}
          movingCardIds={[]}
        />
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
