import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import Modal from '~/ui/global/modals/Modal'
import Panel from '~/ui/global/Panel'
import RolesMenuDialogActions from '~/ui/roles/RolesMenuDialogActions'
import Tooltip from '~/ui/global/Tooltip'
import { Heading3 } from '~/ui/global/styled/typography'
import {
  FooterBreak,
  Row,
  RowItemGrid,
  ScrollArea,
  StyledHeaderRow,
} from '~/ui/global/styled/layout'
import { LeaveButton } from '~/ui/global/styled/buttons'

@inject('apiStore', 'uiStore')
@observer
class AdminUsersModal extends React.Component {
  componentDidMount() {
    this.props.apiStore.fetchShapeAdminUsers()
  }

  handleClose = async ev => {
    const { uiStore, open } = this.props
    if (open) {
      uiStore.closeAdminUsersMenu()
    }
  }

  renderInvitedUsers() {
    const activeUsers = []
    const pendingUsers = []

    this.props.apiStore.shapeAdminUsers.forEach(user => {
      user.status === 'pending'
        ? pendingUsers.push(user)
        : activeUsers.push(user)
    })

    const pendingUserCount = pendingUsers.length

    return (
      <ScrollArea>
        {pendingUserCount > 0 &&
          this.renderUsersPanel(
            pendingUsers,
            `Pending Invitations (${pendingUserCount})`,
            false
          )}
        {this.renderUsersPanel(
          activeUsers,
          `Active Users (${activeUsers.length})`,
          true
        )}
      </ScrollArea>
    )
  }

  renderUsersPanel(users, title, open) {
    return (
      <Panel title={title} open={open}>
        {users.map(user => (
          <Row key={`${user.internalType}_${user.id}`}>
            <RowItemGrid container alignItems="center" justify="space-between">
              <EntityAvatarAndName entity={user} isJoinableGroup={false} />
            </RowItemGrid>
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title={user.isCurrentUser ? 'Leave' : 'Remove'}
              placement="bottom"
            >
              <LeaveButton onClick={() => this.handleRemoveUserClick(user)}>
                <LeaveIcon />
              </LeaveButton>
            </Tooltip>
          </Row>
        ))}
      </Panel>
    )
  }

  handleRemoveUserClick(user) {
    let prompt
    let confirmText

    if (user.isCurrentUser) {
      prompt = 'Are you sure you want to leave Shape Admin?'
      confirmText = 'Leave'
    } else {
      prompt = `Are you sure you want to remove ${user.nameWithHints ||
        user.name} from Shape Admin?`
      confirmText = 'Remove'
    }

    this.props.uiStore.confirm({
      prompt,
      confirmText,
      iconName: 'Leave',
      onConfirm: () => this.removeUser(user),
    })
  }

  removeUser(user) {
    this.props.apiStore.removeShapeAdminUser(user)
  }

  get dialogActions() {
    return <RolesMenuDialogActions context={'admin'} />
  }

  render() {
    const { open } = this.props
    const title = 'Invite Shape Admin Users'

    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        open={open}
        noScroll
        dialogActions={this.dialogActions}
      >
        <React.Fragment>
          <StyledHeaderRow align="flex-end">
            <Heading3>Previously Invited</Heading3>
          </StyledHeaderRow>
          {this.renderInvitedUsers()}
          <React.Fragment>
            <Row>
              <FooterBreak />
            </Row>
          </React.Fragment>
        </React.Fragment>
      </Modal>
    )
  }
}

AdminUsersModal.propTypes = {
  open: PropTypes.bool.isRequired,
}
AdminUsersModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminUsersModal
