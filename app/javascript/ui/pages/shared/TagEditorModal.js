import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import TagEditor from '~/ui/pages/shared/TagEditor'
import Modal from '~/ui/global/modals/Modal'

@inject('uiStore')
@observer
class TagEditorModal extends React.Component {
  render() {
    const { record, canEdit, uiStore, open } = this.props

    return (
      <Modal
        onClose={() => uiStore.update('tagsModalOpenId', null)}
        title="Tags"
        open={open}
      >
        <TagEditor
          canEdit={canEdit}
          placeholder="Add new tags, separated by comma or pressing enter."
          record={record}
          tagField="tag_list"
        />
      </Modal>
    )
  }
}

TagEditorModal.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
  open: PropTypes.bool,
}
TagEditorModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
TagEditorModal.defaultProps = {
  canEdit: false,
  open: false,
}

export default TagEditorModal
