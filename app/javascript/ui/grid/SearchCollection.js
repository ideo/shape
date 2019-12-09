import PropTypes from 'prop-types'
import { observable, computed, action, runInAction } from 'mobx'
import { updateModelId } from 'datx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import CollectionGrid from '~/ui/grid/CollectionGrid'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import EditableSearchInput from '~/ui/global/EditableSearchInput'
import PageSeparator from '~/ui/global/PageSeparator'
import PlusIcon from '~/ui/icons/PlusIcon'
import Loader from '~/ui/layout/Loader'
import v from '~/utils/variables'

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class SearchCollection extends React.Component {
  @observable
  searchCollectionCards = []

  constructor(props) {
    super(props)
    this.debouncedUpdateSearchTerm = _.debounce(this._updateSearchTerm, 300)
  }

  componentDidMount() {
    this.loadSearchedCards()
  }

  @computed
  get searchCardProperties() {
    return this.searchCollectionCards.map(c => _.pick(c, ['id', 'updated_at']))
  }

  _updateSearchTerm(term) {
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
      per_page: 40,
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
    this.debouncedUpdateSearchTerm(term)
  }

  render() {
    const { uiStore, collection, trackCollectionUpdated } = this.props
    const { gridSettings } = uiStore
    if (uiStore.isLoading || collection.reloading) return <Loader />

    return (
      <div style={{ position: 'relative' }}>
        <CollectionGrid
          {...gridSettings}
          loadCollectionCards={this.loadCollectionCards}
          trackCollectionUpdated={trackCollectionUpdated}
          cardProperties={collection.cardProperties}
          collection={collection}
          canEditCollection={collection.can_edit_content}
          movingCardIds={[]}
        />
        <PageSeparator title={<h3>Search Results</h3>} />
        <EditableSearchInput
          value={collection.search_term}
          onChange={this.onSearchChange}
          canEdit={collection.can_edit}
        />
        <CollectionFilter
          collection={collection}
          canEdit={collection.can_edit_content}
          sortable
        />
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
      </div>
    )
  }
}

SearchCollection.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  trackCollectionUpdate: PropTypes.func.isRequired,
}
SearchCollection.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
SearchCollection.defaultProps = {}

export default SearchCollection
