import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import TagEditor from './TagEditor'

@inject('apiStore')
@observer
class CollectionCardsTagEditor extends React.Component {
  _apiAddRemoveTag = (action, data) => {
    const { cards, apiStore } = this.props
    const { label, type } = data
    // FIXME: type will be passed down once we figure out how to handle it
    console.log({ type })
    apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
      card_ids: _.map(cards, 'id'),
      tag: label,
      type: null,
    })
  }

  addTag = tag => {
    this._apiAddRemoveTag('add', tag)
  }

  removeTag = tag => {
    this._apiAddRemoveTag('remove', tag)
  }

  get records() {
    const { cards } = this.props
    return _.compact(_.map(cards, 'record'))
  }

  render() {
    const { canEdit, placeholder, tagColor } = this.props

    return (
      <TagEditor
        records={this.records}
        afterAddTag={this.addTag}
        afterRemoveTag={this.removeTag}
        canEdit={canEdit}
        placeholder={placeholder}
        tagColor={tagColor}
        tagField="tag_list"
      />
    )
  }
}

CollectionCardsTagEditor.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CollectionCardsTagEditor.propTypes = {
  cards: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
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
