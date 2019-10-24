import _ from 'lodash'
import PropTypes from 'prop-types'
import ReactTags from 'react-tag-autocomplete'
import { observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import SearchIconRight from '~/ui/icons/SearchIconRight'
import TagIcon from '~/ui/icons/TagIcon'

import { apiStore, uiStore } from '~/stores'
import { SubduedText } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/modals/Modal'
import Pill from '~/ui/global/Pill'
import StyledReactTags from '~/ui/pages/shared/StyledReactTags'

@observer
class FilterSearchModal extends React.Component {
  @observable
  tagNames = []
  @observable
  searchResultCount = null

  constructor(props) {
    super(props)
    this.debouncedTermSearch = _.debounce(this._autocompleteTermSearch, 400)
  }

  async componentDidMount() {
    const results = await this.getOrganizationTagList()
    runInAction(() => {
      this.tagNames = results
    })
  }

  get formattedSuggestions() {
    const { filterType } = this.props
    if (filterType === 'Search Term') return []
    return _.uniq(this.tagNames).map(tag => ({ id: null, name: tag }))
  }

  get filtersFormattedAsTags() {
    // TODO shared with FilterBar
    const { filters } = this.props
    return filters.map(filter => {
      const tag = {
        id: filter.id,
        name: filter.text,
        label: filter.text,
        symbol:
          filter.filter_type === 'tag' ? <TagIcon /> : <SearchIconRight />,
        selectable: true,
        selected: filter.selected,
        onSelect: this.onTagSelect,
      }
      tag.onDelete = this.onRemoveTag(tag)
      return tag
    })
  }

  getCollectionTagList() {
    const { currentUserOrganizationId } = apiStore
    const apiPath = `organizations/${currentUserOrganizationId}/tags`
    return apiStore.requestJson(apiPath)
  }

  _autocompleteTermSearch = async term => {
    const { viewingCollection } = uiStore
    const apiPath = `collections/${viewingCollection.id}/collection_cards?q=${term}`
    const result = await apiStore.request(apiPath)
    runInAction(() => {
      this.searchResultCount = result.data.length
    })
  }

  handleModalClose = ev => {
    this.props.onModalClose()
  }

  onNewTag = tag => {
    this.props.onCreateTag(tag)
  }

  onRemoveTag = tag => ev => {
    this.props.onRemoveTag(tag)
  }

  onTagSelect = tag => {
    this.props.onSelectTag(tag)
  }

  onInputChange = text => {
    const { filterType } = this.props
    if (filterType === 'Search Term') {
      if (text.length < 4) {
        runInAction(() => {
          this.searchResultCount = null
        })
      } else {
        return this.debouncedTermSearch(text)
      }
    }
  }

  render() {
    const { filterType, modalOpen } = this.props
    if (!modalOpen || !filterType) return null

    const title = `Filter by ${filterType}`
    const placeholder = `enter ${filterType.toLowerCase()} here`

    return (
      <Modal title={title} onClose={this.handleModalClose} open={modalOpen}>
        <div style={{ height: '140px' }}>
          <StyledReactTags>
            <ReactTags
              tags={this.filtersFormattedAsTags}
              suggestions={this.formattedSuggestions}
              allowBackspace={false}
              delimiterChars={[',']}
              placeholder={placeholder}
              handleAddition={this.onNewTag}
              handleDelete={this.onRemoveTag}
              handleInputChange={this.onInputChange}
              tagComponent={Pill}
              allowNew
            />
          </StyledReactTags>
          <br />
          {this.searchResultCount !== null && (
            <SubduedText>{this.searchResultCount} Results</SubduedText>
          )}
        </div>
      </Modal>
    )
  }
}

FilterSearchModal.propTypes = {
  filters: MobxPropTypes.arrayOrObservableArray.isRequired,
  onCreateTag: PropTypes.func.isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  onSelectTag: PropTypes.func.isRequired,
  onModalClose: PropTypes.func,
  filterType: PropTypes.oneOf(['Tags', 'Search Term', null]),
  modalOpen: PropTypes.bool,
}

FilterSearchModal.defaultProps = {
  onModalClose: () => {},
  filterType: null,
  isFilterBarActive: false,
  modalOpen: false,
}

export default FilterSearchModal
