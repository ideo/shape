import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import Modal from '~/ui/global/Modal'

@inject('uiStore')
@observer
class TagEditor extends React.Component {
  @observable tagText = ''

  constructor(props) {
    super(props)
    this.saveTags = _.debounce(this._saveTags, 1000)
    this.tagText = props.record.tag_list
  }

  _saveTags = () => {
    const { record } = this.props
    record.tag_list = this.tagText
    console.log(record)
    record.save()
  }

  @action updateTags = (ev) => {
    this.tagText = ev.target.value
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
        <input
          value={this.tagText}
          onChange={this.updateTags}
        />
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
