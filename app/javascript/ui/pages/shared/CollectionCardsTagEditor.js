import _ from 'lodash'
import PropTypes from 'prop-types'
import { toJS, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import TagEditor from './TagEditor'

@inject('apiStore')
@observer
class CollectionCardsTagEditor extends React.Component {
  async componentDidMount() {
    await this.initializeSelectedRecordsTags()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.cardIds.length != this.props.cardIds.length) {
      this.initializeSelectedRecordsTags()
    }
  }

  async initializeSelectedRecordsTags() {
    const { records } = this.props

    // attach userTags to record
    await Promise.all(
      _.map(records, async r => {
        return await r.initializeCollectionTags()
      })
    )
  }

  @computed
  get selectedRecordTags() {
    const { records } = this.props
    // TODO: check uniqueness and sort
    const recordTags = _.flatMap(records, r => {
      const { collectionTags } = r
      return toJS(collectionTags)
    })
    return recordTags
  }

  // NOTE: this is used to bulk-update and cache bust tags for selected cards
  _apiAddRemoveTag = (action, data) => {
    const { cardIds, apiStore } = this.props
    const { label, type } = data
    apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
      card_ids: cardIds,
      tag: label,
      type,
    })
  }

  addTag = ({ label, type }) => {
    this._apiAddRemoveTag('add', { label, type })
  }

  removeTag = ({ label, type }) => {
    this._apiAddRemoveTag('remove', { label, type })
  }

  render() {
    const { canEdit, placeholder, tagColor } = this.props
    // FIXME: will support user_tag_list in the next story
    const tagField = 'tag_list'
    return (
      <TagEditor
        recordTags={this.selectedRecordTags}
        afterAddTag={this.addTag}
        afterRemoveTag={this.removeTag}
        canEdit={canEdit}
        placeholder={placeholder}
        tagColor={tagColor}
        tagField={tagField}
      />
    )
  }
}

CollectionCardsTagEditor.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CollectionCardsTagEditor.propTypes = {
  records: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
  cardIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  canEdit: PropTypes.bool,
  placeholder: PropTypes.string,
  tagColor: PropTypes.string,
}

CollectionCardsTagEditor.defaultProps = {
  canEdit: false,
  tagColor: null,
  placeholder: null,
}

export default CollectionCardsTagEditor
