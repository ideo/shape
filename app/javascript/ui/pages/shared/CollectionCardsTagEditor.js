import _ from 'lodash'
import PropTypes from 'prop-types'
import { toJS, action, computed } from 'mobx'
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

  @computed
  // takes all tags for all selected records and formats them by type
  // for the <ReactTags/> to determine which tagComponent to render
  get selectedTags() {
    const { records } = this
    const selectedRecordTags = _.map(
      _.flatten(_.intersection(_.map(records, r => toJS(r['tag_list'])))),
      tag => ({
        label: tag,
        type: 'tag_list',
      })
    )

    const { apiStore } = this.props
    const { currentUserOrganization } = apiStore
    const { organization_users } = currentUserOrganization
    // This contains id, first_name, last_name, handle
    const selectedRecordUserTags = _.map(
      _.flatten(
        _.intersection(_.filter(records, r => !!toJS(r['user_tag_list'])))
      ),
      tag => ({
        label: tag,
        type: 'user_tag_list',
      })
    )

    // TODO: test this
    const mappedUserTags = _.filter(
      organization_users,
      a => a && selectedRecordUserTags.includes(a.handle)
    )
    const combinedTagList = [...selectedRecordTags, ...mappedUserTags]
    return combinedTagList
  }

  // NOTE: this is used to bulk-update and cache bust tags for selected cards
  _apiAddRemoveTag = (action, data) => {
    const { cards, apiStore } = this.props
    const { label, type } = data
    apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
      card_ids: _.map(cards, 'id'),
      tag: label,
      type,
    })
  }

  @action
  addTag = ({ label, type }) => {
    const { records } = this
    // update frontend model tags
    records.forEach(record => {
      record[type].push(label)
    })

    this._apiAddRemoveTag('add', { label, type })
  }

  @action
  removeTag = ({ label, type }) => {
    const { records } = this
    records.forEach(record => {
      // update frontend model tags
      _.pull(record[type], label)
    })

    this._apiAddRemoveTag('remove', { label, type })
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
