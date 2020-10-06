import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import RolesDialogActions from '~/ui/roles/RolesDialogActions'

import Modal from '~/ui/global/modals/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'

@inject('uiStore', 'apiStore')
@observer
class RolesModal extends React.Component {
  handleClose = async () => {
    const { uiStore, record, open } = this.props
    if (open) {
      if (uiStore.viewingRecord === record) {
        // re-fetch record in case roles were altered during RolesMenu searching/editing
        await record.refetch()
      }
      uiStore.closeRolesMenu()
    }
  }

  get dialogActions() {
    const { record } = this.props

    return <RolesDialogActions record={record} />
  }

  render() {
    const { record, open, uiStore } = this.props

    return (
      <Modal
        title={`Sharing: ${record.name}`}
        onClose={this.handleClose}
        open={open}
        noScroll
        dialogActions={this.dialogActions}
      >
        <RolesMenu
          record={record}
          canEdit={record.can_edit}
          ownerId={record.id}
          ownerType={record.internalType}
          submissionBox={record.isSubmissionBox}
          addedNewRole={uiStore.addedNewRole}
          title="Shared with"
        />
      </Modal>
    )
  }
}

RolesModal.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  open: PropTypes.bool.isRequired,
}
RolesModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RolesModal
