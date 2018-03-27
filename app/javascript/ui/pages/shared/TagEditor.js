import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import Modal from '~/ui/global/Modal'
import StyledReactTags from './StyledReactTags'

@inject('uiStore')
@observer
class TagEditor extends React.Component {
  @observable tags = []

  constructor(props) {
    super(props)
    this.saveTags = _.debounce(this._saveTags, 1000)
    this.initTags(props.record.tag_list)
  }

  componentWillReceiveProps(nextProps) {
    this.initTags(nextProps.record.tag_list)
  }

  componentWillUnmount() {
    this.saveTags.flush()
  }

  @action initTags = (tag_list) => {
    // `id` is used by react-tag-autocomplete, but otherwise doesn't hold any meaning
    this.tags = _.map([...tag_list], (t, i) => ({
      id: i, name: t
    }))
  }

  _saveTags = () => {
    const { record } = this.props
    record.tag_list = _.map([...this.tags], t => t.name).join(', ')
    record.save()
  }

  @action handleAddition = (tag) => {
    const found = this.tags.find(t => t.name === tag.name)
    if (!found) {
      this.tags.push(tag)
      this.saveTags()
    } else {
      // tag already exists, don't add to the list.
      // Any error/message in the UI needed?
    }
  }

  @action handleDelete = (i) => {
    this.tags.remove(this.tags[i])
    this.saveTags()
  }

  readOnlyTags = () => {
    const { record } = this.props
    if (!record.tag_list.length) {
      return 'No tags added.'
    }
    const inner = record.tag_list.map(tag => (
      <div key={tag} className="react-tags__selected-tag read-only">
        <span className="react-tags__selected-tag-name">
          {tag}
        </span>
      </div>
    ))
    return (
      <div className="react-tags__selected">
        {inner}
      </div>
    )
  }

  render() {
    const { canEdit, uiStore } = this.props

    return (
      <Modal
        onClose={() => uiStore.update('tagsModalOpen', false)}
        title="Tags"
        open={uiStore.tagsModalOpen}
      >
        <StyledReactTags>
          {!canEdit && this.readOnlyTags()}
          {canEdit &&
            <ReactTags
              tags={[...this.tags]}
              allowBackspace={false}
              delimiterChars={[',']}
              placeholder="Add new tags, separated by comma or pressing enter."
              handleAddition={this.handleAddition}
              handleDelete={this.handleDelete}
              allowNew
            />
          }
        </StyledReactTags>
      </Modal>
    )
  }
}

TagEditor.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
}
TagEditor.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
TagEditor.defaultProps = {
  canEdit: false,
}

export default TagEditor
