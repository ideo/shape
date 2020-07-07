import _ from 'lodash'
import PropTypes from 'prop-types'
import { toJS, computed, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import TagEditor from './TagEditor'

export const formatRecordTags = records => {
  const recordTags = _.flatMap(records, r => {
    const { tags } = r
    return toJS(tags)
  })
  return _.uniqBy(recordTags, tag => tag.label)
}

@inject('apiStore')
@observer
class CollectionCardsTagEditor extends React.Component {
  componentDidMount() {
    this.initializeSelectedRecordsTags()
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(prevProps.cardIds.sort(), this.props.cardIds.sort())) {
      this.initializeSelectedRecordsTags()
    }
  }

  async initializeSelectedRecordsTags() {
    const { records } = this.props

    // attach userTags to record
    await Promise.all(
      _.map(records, async r => {
        return await r.initializeTags()
      })
    )
  }

  @computed
  get selectedRecordTags() {
    const { records } = this.props
    return (!_.isEmpty(records) && formatRecordTags(records)) || []
  }

  // NOTE: this is used to bulk-update and cache bust tags for selected cards
  _apiAddRemoveTag = (action, data) => {
    const { cardIds, apiStore, overrideTagType } = this.props
    const { label, type } = data
    let tagType = type
    // Override to set a tag type - rather than using the type from this tag
    if (overrideTagType) tagType = overrideTagType
    apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
      card_ids: cardIds,
      tag: label,
      type: tagType,
    })
  }

  @action
  addTag = ({ label, type, user }) => {
    const { records } = this.props
    // update frontend model tags observable to rerender TagEditor
    _.each(records, r => {
      r.tags.push({ label, type, user })
    })
    this._apiAddRemoveTag('add', { label, type })
  }

  @action
  removeTag = ({ label, type, user }) => {
    const { records } = this.props
    // update frontend model tags observable to rerender TagEditor
    _.each(records, r => {
      _.remove(r.tags, t => {
        return t.label === label && t.type === type
      })
    })
    this._apiAddRemoveTag('remove', { label, type })
  }

  render() {
    const {
      canEdit,
      placeholder,
      tagColor,
      suggestions,
      handleInputChange,
    } = this.props
    return (
      <TagEditor
        recordTags={this.selectedRecordTags}
        afterAddTag={this.addTag}
        afterRemoveTag={this.removeTag}
        canEdit={canEdit}
        placeholder={placeholder}
        tagColor={tagColor}
        suggestions={suggestions}
        handleInputChange={handleInputChange}
      />
    )
  }
}

CollectionCardsTagEditor.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CollectionCardsTagEditor.propTypes = {
  records: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
  cardIds: PropTypes.array.isRequired,
  canEdit: PropTypes.bool,
  placeholder: PropTypes.string,
  tagColor: PropTypes.string,
  suggestions: PropTypes.array,
  handleInputChange: PropTypes.func,
  overrideTagType: PropTypes.string,
}

CollectionCardsTagEditor.defaultProps = {
  canEdit: false,
  tagColor: null,
  placeholder: null,
  suggestions: [],
  handleInputChange: undefined,
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  overrideTagType: null,
}

CollectionCardsTagEditor.displayName = 'CollectionCardsTagEditor'

export default CollectionCardsTagEditor
