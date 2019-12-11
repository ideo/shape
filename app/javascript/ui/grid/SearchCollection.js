import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observable, computed, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import CollectionGrid from '~/ui/grid/CollectionGrid'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import { DisplayText } from '~/ui/global/styled/typography'
import EditableSearchInput from '~/ui/global/EditableSearchInput'
import PageSeparator from '~/ui/global/PageSeparator'
import Loader from '~/ui/layout/Loader'

@inject('uiStore')
@observer
class SearchCollection extends React.Component {
  @observable
  searchCollectionCards = []
  @observable
  loading = true

  constructor(props) {
    super(props)
    this.debouncedUpdateSearchTerm = _.debounce(this._updateSearchTerm, 1000)
  }

  async componentDidMount() {
    await this.loadSearchedCards()
    runInAction(() => {
      this.loading = false
    })
  }

  @computed
  get searchCardProperties() {
    if (!this.searchCollectionCards) return []
    return this.searchCollectionCards.map(c => _.pick(c, ['id', 'updated_at']))
  }

  _updateSearchTerm() {
    const { collection } = this.props
    collection.save().then(() => {
      this.loadSearchedCards()
    })
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

  loadSearchedCards = async ({ page, per_page, rows, cols } = {}) => {
    const { collection } = this.props
    const { search_term } = collection
    const cards = await collection.API_fetchCards({
      searchTerm: search_term,
      page,
      per_page: collection.recordsPerPage,
    })
    runInAction(() => {
      if (page > 1) {
        // TODO copied from Collection.js
        const newData = _.reverse(
          // de-dupe merged data (deferring to new cards first)
          // reverse + reverse so that new cards (e.g. page 2) are replaced first but then put back at the end
          _.unionBy(
            _.reverse([...cards]),
            _.reverse([...this.searchCollectionCards]),
            'id'
          )
        )
        this.searchCollectionCards.replace(newData)
      } else {
        this.searchCollectionCards = cards
      }
    })
  }

  onSearchChange = term => {
    const { collection } = this.props
    collection.search_term = term
    this.debouncedUpdateSearchTerm()
  }

  render() {
    const { uiStore, collection, trackCollectionUpdated } = this.props
    const { blankContentToolState, gridSettings } = uiStore
    if (uiStore.isLoading || collection.reloading) return <Loader />

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
        <EditableSearchInput
          value={collection.search_term || ''}
          onChange={this.onSearchChange}
          canEdit={collection.can_edit}
          dataCy="SearchCollectionInput"
        />
        <CollectionFilter
          collection={collection}
          canEdit={collection.can_edit_content}
          sortable
        />
        {this.loading ? (
          <Loader />
        ) : (
          <Fragment>
            {this.searchCollectionCards.length === 0 ? (
              <DisplayText data-cy="SearchCollectionEmptyMessage">
                Enter search criteria to populate this collection
              </DisplayText>
            ) : (
              <CollectionGrid
                {...gridSettings}
                loadCollectionCards={this.loadSearchedCards}
                trackCollectionUpdated={trackCollectionUpdated}
                collectionCardsOverride={this.searchCollectionCards}
                cardProperties={this.searchCardProperties}
                collection={collection}
                canEditCollection={false}
                movingCardIds={[]}
                sorting
              />
            )}
          </Fragment>
        )}
      </div>
    )
  }
}

SearchCollection.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  trackCollectionUpdate: PropTypes.func.isRequired,
}
SearchCollection.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
SearchCollection.defaultProps = {}

export default SearchCollection
