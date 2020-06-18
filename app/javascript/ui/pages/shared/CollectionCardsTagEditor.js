import _ from 'lodash'
import PropTypes from 'prop-types'
import { toJS, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import TagEditor from './TagEditor'

@inject('apiStore')
@observer
class CollectionCardsTagEditor extends React.Component {
  componentDidMount() {
    const { apiStore } = this.props
    const { currentUserOrganization } = apiStore
    currentUserOrganization.fetchOrganizationUsers()
  }

  get selectedTags() {
    return this.filterSelectedTagsForRecords()
  }

  filterSelectedTagsForRecords() {
    const { records } = this
    const selectedRecordTags = _.flatten(
      _.intersection(_.map(records, r => toJS(r['tag_list'])))
    )

    // TODO: combine with user tag list once implemented
    const { apiStore } = this.props
    const { currentUserOrganization } = apiStore
    const { organization_users } = currentUserOrganization
    // This contains id, first_name, last_name, handle
    const selectedRecordUserTags = _.flatten(
      _.intersection(_.map(records, r => toJS(r['user_tag_list'])))
    )

    const mappedUserTags = _.filter(
      organization_users,
      a => a && selectedRecordUserTags.includes(a.handle)
    )
    const combinedTagList = [...selectedRecordTags, ...mappedUserTags]
    return combinedTagList
  }

  // FIXME: endpoint CollectionCardsAddRemoveTagWorker, see if we can deprecate
  // _apiAddRemoveTag = (action, data) => {
  //   const { cards, apiStore } = this.props
  //   const { label, type } = data
  //   apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
  //     card_ids: _.map(cards, 'id'),
  //     tag: label,
  //     type: null,
  //   })
  // }

  @action
  addTag = ({ label, type }) => {
    const { records } = this
    records.forEach(record => {
      // FIXME: does not work at the moment; check how deserializable collection can handle custom tags?
      record[type].push({ type, label })
      record.save()
    })
  }

  @action
  removeTag = ({ label, type }) => {
    const { records } = this
    records.forEach(record => {
      // FIXME: does not work at the moment; check how deserializable collection can handle custom tags?
      record[type] = _.filter(
        toJS(record[type]),
        t => t.label !== label && t.type !== type
      )
      record.save()
    })
  }

  get records() {
    const { cards } = this.props
    return _.compact(_.map(cards, 'record'))
  }

  render() {
    const { canEdit, placeholder, tagColor } = this.props
    return (
      <TagEditor
        recordTags={this.selectedTags}
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
