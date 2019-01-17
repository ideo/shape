import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import StyledReactTags from './StyledReactTags'

@observer
class TagEditor extends React.Component {
  @observable
  tags = []
  @observable
  error = ''

  constructor(props) {
    super(props)
    this.saveTags = _.debounce(this._saveTags, 1000)
    if (!props.record[props.tagField]) {
      // should be some kind of error if tagField doesn't exist
      props.record[props.tagField] = []
    }
    this.initTags(props.record[props.tagField])
  }

  componentWillReceiveProps(nextProps) {
    this.initTags(nextProps.record[nextProps.tagField])
  }

  componentWillUnmount() {
    this.saveTags.flush()
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
    const { record, tagField, afterSave } = this.props
    record[tagField] = _.map([...this.tags], t => t.name).join(',')
    await record.patch()
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

  readOnlyTags = () => {
    const { record, tagField } = this.props
    if (!record[tagField].length) {
      return 'No tags added.'
    }
    const inner = record[tagField].map(tag => (
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
        {!canEdit && this.readOnlyTags()}
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

TagEditor.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
  tagField: PropTypes.string.isRequired,
  tagColor: PropTypes.string,
  placeholder: PropTypes.string,
  validate: PropTypes.string,
  afterSave: PropTypes.func,
}
TagEditor.defaultProps = {
  canEdit: false,
  tagColor: 'gray',
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  validate: null,
  afterSave: null,
}

export default TagEditor
