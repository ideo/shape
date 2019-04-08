import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'

@inject('uiStore')
@observer
class RolesModal extends React.Component {
  handleClose = async ev => {
    const { uiStore, record, open } = this.props
    if (open) {
      if (uiStore.viewingRecord === record) {
        // re-fetch record in case roles were altered during RolesMenu searching/editing
        await record.refetch()
      }
      uiStore.closeRolesMenu()
    }
  }

  render() {
    const { record, open } = this.props
    const title = `Sharing: ${record.name}`

    return (
      <Modal
        data-leave-cards-selected
        title={title}
        onClose={this.handleClose}
        open={open}
        noScroll
      >
        <RolesMenu
          record={record}
          canEdit={record.can_edit}
          ownerId={record.id}
          ownerType={record.internalType}
          submissionBox={record.isSubmissionBox}
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
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RolesModal
