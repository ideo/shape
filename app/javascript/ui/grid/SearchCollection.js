import PropTypes from 'prop-types'
import { observable, computed, action, runInAction } from 'mobx'
import { updateModelId } from 'datx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import CollectionGrid from '~/ui/grid/CollectionGrid'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
import PageSeparator from '~/ui/global/PageSeparator'
import PlusIcon from '~/ui/icons/PlusIcon'
import Loader from '~/ui/layout/Loader'
import v from '~/utils/variables'

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class SearchCollection extends React.Component {
  @observable
  searchCollectionCards = []

  componentDidMount() {
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

  loadSearchedCards = async ({ page, per_page, rows, cols } = {}) => {
    const { collection } = this.props
    const { search_term } = collection
    const cards = await collection.API_fetchCards({
      searchTerm: search_term,
      per_page: 20,
    })
    runInAction(() => {
      this.searchCollectionCards = cards
    })
  }

  @computed
  get searchCardProperties() {
    return this.searchCollectionCards.map(c => _.pick(c, ['id', 'updated_at']))
  }

  render() {
    const { uiStore, collection } = this.props
    const { gridSettings } = uiStore
    if (uiStore.isLoading || collection.reloading) return <Loader />

    return (
      <div style={{ position: 'relative' }}>
        <CollectionGrid
          {...gridSettings}
          loadCollectionCards={this.loadCollectionCards}
          trackCollectionUpdated={this.trackCollectionUpdated}
          cardProperties={collection.cardProperties}
          collection={collection}
          canEditCollection={collection.can_edit_content}
          movingCardIds={[]}
          sorting
        />
        <PageSeparator title={<h3>Search Results</h3>} />
        <CollectionFilter
          collection={collection}
          canEdit={collection.can_edit_content}
          sortable
        />
        <CollectionGrid
          {...gridSettings}
          loadCollectionCards={this.loadSearchedCards}
          trackCollectionUpdated={this.trackCollectionUpdated}
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
}
SearchCollection.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
SearchCollection.defaultProps = {}

export default SearchCollection
