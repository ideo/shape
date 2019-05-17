import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import Grid from '@material-ui/core/Grid'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import Modal from '~/ui/global/modals/Modal'
import Panel from '~/ui/global/Panel'
import RolesAdd from '~/ui/roles/RolesAdd'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import { Heading3 } from '~/ui/global/styled/typography'
import { Row } from '~/ui/global/styled/layout'

const StyledHeaderRow = styled(Row)`
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-left: 0;
  margin-bottom: 0;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 100%;
  }
`

const ScrollArea = styled.div`
  flex: 1 1 auto;
  min-height: 220px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`

const RowItemGrid = styled(Grid)`
  align-self: center;
  margin-left: 14px;
`

const LeaveIconHolder = styled.button`
  margin-top: 8px;
  width: 16px;
`
LeaveIconHolder.displayName = 'StyledLeaveIconHolder'

const FooterBreak = styled.div`
  border-top: 1px solid ${v.colors.commonMedium};
  width: 100%;
`

const FooterArea = styled.div`
  flex: 0 0 auto;
  padding-top: 24px;
  padding-bottom: 30px;
`

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
            `Previously Invited (${pendingUserCount})`,
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
              <LeaveIconHolder onClick={() => this.handleRemoveUserClick(user)}>
                <LeaveIcon />
              </LeaveIconHolder>
            </Tooltip>
            <LeaveIconHolder enabled={false} />
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
      prompt = `Are you sure you want to remove
        ${user.nameWithHints || user.name} from Shape Admin?`
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

  createRoles = (users, _, opts = {}) => {
    this.props.apiStore.addShapeAdminUsers(users, opts)
  }

  createUsers = emails => {
    const { apiStore, uiStore } = this.props
    return apiStore
      .request(`users/create_from_emails`, 'POST', { emails })
      .catch(err => {
        uiStore.alert(err.error[0])
      })
  }

  render() {
    const { open } = this.props
    const title = 'Invite Shape Admin Users'

    return (
      <Modal title={title} onClose={this.handleClose} open={open} noScroll>
        <React.Fragment>
          <StyledHeaderRow align="flex-end">
            <Heading3>Previously Invited</Heading3>
          </StyledHeaderRow>
          {this.renderInvitedUsers()}
          <React.Fragment>
            <Row>
              <FooterBreak />
            </Row>
            <FooterArea>
              <RolesAdd
                title={'Add People:'}
                roleTypes={['shapeAdmin']}
                onCreateRoles={this.createRoles}
                onCreateUsers={this.createUsers}
                ownerType={'shapeAdmins'}
              />
            </FooterArea>
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
