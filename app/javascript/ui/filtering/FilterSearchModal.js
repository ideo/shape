import _ from 'lodash'
import PropTypes from 'prop-types'
import ReactTags from 'react-tag-autocomplete'
import { observable, runInAction } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'

import { apiStore, uiStore } from '~/stores'
import { SubduedText } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/modals/Modal'
import Pill from '~/ui/global/Pill'
import StyledReactTags from '~/ui/pages/shared/StyledReactTags'
import { filtersToTags } from '~/ui/filtering/shared'

@observer
@inject('apiStore')
class FilterSearchModal extends React.Component {
  @observable
  searchResultCount = null

  constructor(props) {
    super(props)
    this.debouncedTermSearch = _.debounce(this._autocompleteTermSearch, 400)
  }

  componentDidMount() {
    this.initializeSuggestions()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.modalOpen != this.props.modalOpen) {
      this.initializeSuggestions()
    }
  }

  async initializeSuggestions() {
    const { currentUserOrganization } = this.props.apiStore
    await currentUserOrganization.initializeTags()
  }

  get formattedSuggestions() {
    const { filterType } = this.props
    if (filterType === 'Search Term') return []
    const { currentOrganization } = this.props.apiStore
    const { tags } = currentOrganization
    return tags
  }

  get filtersFormattedAsTags() {
    const { filters } = this.props
    return filtersToTags({
      filters,
      onDelete: this.onRemoveTag,
      onSelect: this.onTagSelect,
    })
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

  onRemoveTag = tag => {
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
      <Modal
        title={title}
        onClose={this.handleModalClose}
        open={modalOpen}
        scrollVisible
      >
        <div style={{ paddingBottom: '20px' }}>
          <StyledReactTags>
            <ReactTags
              tags={this.filtersFormattedAsTags}
              suggestions={this.formattedSuggestions}
              allowBackspace={false}
              delimiterChars={[',']}
              placeholder={placeholder}
              handleAddition={this.onNewTag}
              handleDelete={tag => ev => this.onRemoveTag(tag)}
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

FilterSearchModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.arrayOrObservableArray.isRequired,
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
