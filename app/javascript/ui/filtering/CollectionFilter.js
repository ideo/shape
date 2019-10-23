import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { computed, observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'

import { apiStore, uiStore } from '~/stores'
import FilterBar from './FilterBar'
import FilterMenu from './FilterMenu'
import FilterSearchModal from './FilterSearchModal'

@observer
class CollectionFilter extends React.Component {
  @observable
  currentFilterLookupType = null

  @computed
  get tagFilters() {
    const {
      collection: { collection_filters },
    } = this.props
    return collection_filters.filter(filter => filter.filter_type === 'tag')
  }

  @computed
  get searchFilters() {
    const {
      collection: { collection_filters },
    } = this.props
    return collection_filters.filter(filter => filter.filter_type === 'search')
  }

  /*
   * This method is a decorator that wraps any changes in the collection filters
   * and sets up a loader, and fetches the collection cards after the filter
   * change has happened. It should be used for all methods that change filters
   * that required a collection card reload
   */
  async onFilterChange(fn) {
    uiStore.update('isLoading', true)
    try {
      const result = await fn()
      const { collection } = this.props
      // Refetch the cards now that the filters have changed
      runInAction(() => {
        collection.storedCacheKey = null
      })
      await collection.API_fetchCards({ page: 1 })
      return result
    } catch (e) {
      throw e
    } finally {
      uiStore.update('isLoading', false)
    }
  }

  onCreateFilter = async tag => {
    return this.onFilterChange(async () => {
      const { collection } = this.props
      if (!this.currentFilterLookupType) return
      const backendFilterType = pluralize
        .singular(this.currentFilterLookupType)
        .toLowerCase()
        .split(' ')[0]
      const filter = {
        text: tag.name,
        filter_type: backendFilterType,
        selected: false,
      }
      return collection.API_createCollectionFilter(filter)
    })
  }

  onDeleteFilter = async tag => {
    return this.onFilterChange(async () => {
      const { collection } = this.props
      const filter = apiStore.find('collection_filters', tag.id)
      if (filter) {
        return collection.API_destroyCollectionFilter(filter)
      }
    })
  }

  onSelectFilter = async tag => {
    return this.onFilterChange(async () => {
      const filter = apiStore.find('collection_filters', tag.id)
      return filter.API_toggleSelected(!tag.selected)
    })
  }

  onShowAll = ev => {
    return this.onFilterChange(() => {
      const {
        collection: { collection_filters },
      } = this.props
      collection_filters.forEach(filter => {
        filter.API_toggleSelected(false)
      })
    })
  }

  openSearchModal = filterType => () => {
    runInAction(() => {
      this.currentFilterLookupType = filterType
    })
  }

  render() {
    const {
      collection,
      collection: { collection_filters },
      canEdit,
    } = this.props
    const isFilterBarActive =
      collection_filters && collection_filters.length > 0
    return (
      <Flex>
        {isFilterBarActive && (
          <FilterBar
            filters={collection_filters}
            totalResults={
              !uiStore.isLoading && collection.collection_cards.length
            }
            onDelete={this.onDeleteFilter}
            onSelect={this.onSelectFilter}
            onShowAll={this.onShowAll}
          />
        )}
        {canEdit && (
          <FilterMenu
            isFilterBarActive={isFilterBarActive}
            onFilterByTag={this.openSearchModal('Tags')}
            onFilterBySearch={this.openSearchModal('Search Term')}
          />
        )}
        {!!this.currentFilterLookupType && (
          <FilterSearchModal
            filters={
              this.currentFilterLookupType === 'Tags'
                ? [...this.tagFilters]
                : [...this.searchFilters]
            }
            onCreateTag={this.onCreateFilter}
            onRemoveTag={this.onDeleteFilter}
            onSelectTag={this.onSelectFilter}
            onModalClose={this.openSearchModal(null)}
            filterType={this.currentFilterLookupType}
            modalOpen={!!this.currentFilterLookupType}
          />
        )}
      </Flex>
    )
  }
}

CollectionFilter.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
}

CollectionFilter.defaultProps = {
  canEdit: false,
}

export default CollectionFilter
