import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/Modal'

@inject('uiStore')
@observer
class TagEditor extends React.Component {
  render() {
    const { uiStore } = this.props

    return (
      <Modal
        onClose={() => uiStore.update('tagsModalOpen', false)}
        title="Tags"
        open={uiStore.tagsModalOpen}
      >
        <h4>Hi everyone</h4>
      </Modal>
    )
  }
}

TagEditor.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TagEditor
