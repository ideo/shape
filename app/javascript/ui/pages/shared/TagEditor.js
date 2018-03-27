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
    // `id` is used by react-tag-autocomplete, but otherwise doesn't hold any meaning
    this.tags = _.map([...props.record.tag_list], (t, i) => ({
      id: i, name: t
    }))
  }

  componentWillUnmount() {
    this.saveTags.flush()
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

  render() {
    const { uiStore } = this.props

    return (
      <Modal
        onClose={() => uiStore.update('tagsModalOpen', false)}
        title="Tags"
        open={uiStore.tagsModalOpen}
      >
        <StyledReactTags>
          <ReactTags
            tags={[...this.tags]}
            suggestions={[
              { label: 'IDEO', value: 1 },
              { label: 'Prototype', value: 1 },
              { label: 'Colab', value: 1 },
              { label: 'Stuff', value: 1 },
            ]}
            allowBackspace={false}
            delimiterChars={[',']}
            placeholder="Add new tags, separated by comma or pressing enter."
            handleAddition={this.handleAddition}
            handleDelete={this.handleDelete}
            allowNew
          />
        </StyledReactTags>
      </Modal>
    )
  }
}

TagEditor.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}
TagEditor.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TagEditor
