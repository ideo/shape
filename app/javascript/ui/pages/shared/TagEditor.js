import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import StyledReactTags from './StyledReactTags'

const tagsInCommon = (records, tagField) => {
  const tags = []
  records.forEach(record => {
    if (record[tagField] && record[tagField].length > 0)
      tags.push(record[tagField])
  })
  return _.intersection(tags)
}

@inject('apiStore')
@observer
class TagEditor extends React.Component {
  @observable
  tags = []
  @observable
  error = ''

  constructor(props) {
    super(props)
    this.saveTags = _.debounce(this._saveTags, 1000)
    this.initTagFields(props.records, props.tagField)
  }

  componentWillReceiveProps(nextProps) {
    this.initTagFields(nextProps.records, nextProps.tagField)
  }

  componentWillUnmount() {
    this.saveTags.flush()
  }

  initTagFields(records, tagField) {
    records.forEach(record => {
      // should be some kind of error if tagField doesn't exist
      if (!record[tagField]) record[tagField] = []
    })
    // Init with tags that are shared across all records
    this.initTags(tagsInCommon(records, tagField))
  }

  @action
  initTags = tags => {
    // `id` is used by react-tag-autocomplete, but otherwise doesn't hold any meaning
    this.tags = _.map([...tags], (t, i) => ({
      id: i,
      name: t,
    }))
  }

  _saveTags = async () => {
    const { records, tagField, afterSave, apiStore } = this.props
    const tagList = _.map([...this.tags], t => t.name).join(',')
    const itemIds = []
    const collectionIds = []
    records.forEach(record => {
      record[tagField] = tagList
      if (record.internalType === 'items') {
        itemIds.push(record.id)
      } else if (record.internalType === 'collections') {
        collectionIds.push(record.id)
      }
    })
    await apiStore.request(`tags/bulk_update`, {
      tag_list: tagList,
      item_ids: itemIds,
      collection_ids: collectionIds,
    })
    if (afterSave) afterSave()
  }

  @action
  handleAddition = tag => {
    const { validate } = this.props
    tag.name = tag.name.trim()
    this.error = ''
    if (validate === 'domain') {
      const matches = tag.name.match(/([a-z])([a-z0-9]+\.)*[a-z0-9]+\.[a-z.]+/g)
      if (!matches) {
        this.error = 'Invalid domain. Please use the format: domain.com'
        return
      }
      tag.name = _.first(matches)
    }
    const found = this.tags.find(t => t.name === tag.name)
    if (!found) {
      this.tags.push(tag)
      this.saveTags()
    } else {
      // tag already exists, don't add to the list.
      // Any error/message in the UI needed?
    }
  }

  @action
  handleDelete = i => {
    this.tags.remove(this.tags[i])
    this.saveTags()
  }

  readonlyTags = () => {
    const { records, tagField } = this.props
    const tags = tagsInCommon(records, tagField)
    if (tags.length === 0) {
      return 'No tags added.'
    }
    const inner = tags.map(tag => (
      <div key={tag} className="react-tags__selected-tag read-only">
        <span className="react-tags__selected-tag-name">{tag}</span>
      </div>
    ))
    return <div className="react-tags__selected">{inner}</div>
  }

  render() {
    const { canEdit, placeholder, tagColor } = this.props

    return (
      <StyledReactTags tagColor={tagColor}>
        {!canEdit && this.readonlyTags()}
        {canEdit && (
          <ReactTags
            tags={[...this.tags]}
            allowBackspace={false}
            delimiterChars={[',']}
            placeholder={placeholder}
            handleAddition={this.handleAddition}
            handleDelete={this.handleDelete}
            allowNew
          />
        )}
        {this.error && <div className="error">{this.error}</div>}
      </StyledReactTags>
    )
  }
}

TagEditor.wrappedComponent.propTypes = {
  records: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
  canEdit: PropTypes.bool,
  tagField: PropTypes.string.isRequired,
  tagColor: PropTypes.string,
  placeholder: PropTypes.string,
  validate: PropTypes.string,
  afterSave: PropTypes.func,
}
TagEditor.wrappedComponent.defaultProps = {
  canEdit: false,
  tagColor: 'gray',
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  validate: null,
  afterSave: null,
}

export default TagEditor
