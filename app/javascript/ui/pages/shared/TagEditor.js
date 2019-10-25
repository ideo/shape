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
  // Intersection needs each array as separate arguments,
  // which is why apply is used
  return _.intersection.apply(null, tags)
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
    this.initTagFields(props.records, props.tagField)
  }

  componentWillReceiveProps(nextProps) {
    this.initTagFields(nextProps.records, nextProps.tagField)
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
  initTags = tagArray => {
    // `id` is used by react-tag-autocomplete, but otherwise doesn't hold any meaning
    this.tags = _.map([...tagArray], (t, i) => ({
      id: i,
      name: t,
    }))
  }

  @action
  handleAddition = newTag => {
    const { validateTag, records, tagField, afterAddTag } = this.props
    newTag.name = newTag.name.trim()
    this.error = ''

    // Return if tag is a duplicate
    if (this.tags.find(t => t.name === newTag.name)) return

    // If a validateTag function is provided, validate tag
    if (validateTag) {
      const { tag, error } = validateTag(newTag.name)
      if (error) {
        this.error = error
        return
      } else {
        newTag.name = tag
      }
    }
    this.tags.push(newTag)
    records.forEach(record => {
      record[tagField].push(newTag.name)
    })
    afterAddTag(newTag.name)
  }

  @action
  handleDelete = tagIndex => {
    const { records, tagField, afterRemoveTag } = this.props
    const tag = this.tags[tagIndex]
    this.tags.remove(tag)
    records.forEach(record => {
      record[tagField].remove(tag.name)
    })
    afterRemoveTag(tag.name)
  }

  // This is displayed instead of the tag input if the user cannot edit the tags
  readonlyTags = () => {
    if (this.tags.length === 0) {
      return 'No tags added.'
    }
    const inner = this.tags.map(tag => (
      <div key={tag.id} className="react-tags__selected-tag read-only">
        <span className="react-tags__selected-tag-name">{tag.name}</span>
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

TagEditor.displayName = 'TagEditor'

TagEditor.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TagEditor.propTypes = {
  records: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
  afterAddTag: PropTypes.func.isRequired,
  afterRemoveTag: PropTypes.func.isRequired,
  tagField: PropTypes.string.isRequired,
  canEdit: PropTypes.bool,
  tagColor: PropTypes.string,
  placeholder: PropTypes.string,
  validateTag: PropTypes.func,
}

TagEditor.defaultProps = {
  canEdit: false,
  tagColor: 'gray',
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  validateTag: null,
}

export default TagEditor
