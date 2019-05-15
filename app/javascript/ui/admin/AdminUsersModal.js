import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Collapse } from '@material-ui/core'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import Grid from '@material-ui/core/Grid'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import Modal from '~/ui/global/modals/Modal'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import { Heading3, DisplayText } from '~/ui/global/styled/typography'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'

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

const GroupHeader = styled.div`
  background-color: ${v.colors.white};
  cursor: pointer;
  margin-bottom: 15px;
  position: sticky;
  top: 0;
  z-index: 2;
  ${props =>
    props.open &&
    `&:after {
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 4%, rgba(0, 0, 0, 0));
      content: "";
      display: block;
      position: absolute;
      height: 5px;
      width: 100%;
    }`};
`
const StyledRow = styled(Row)`
  margin-left: 0;
  margin-bottom: 0;
`

const StyledCollapseToggle = styled.button`
  .icon {
    width: 24px;
    transform: translateY(4px);
  }
`
const StyledExpandToggle = styled.button`
  .icon {
    width: 24px;
    transform: translateY(2px) rotate(-90deg);
  }
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

@inject('apiStore', 'uiStore')
@observer
class AdminUsersModal extends React.Component {
  state = {
    adminUsers: [],
    activePanelOpen: true,
  }

  async componentDidMount() {
    const res = await this.props.apiStore.fetchShapeAdminUsers()
    this.setState({ adminUsers: res.data })
  }

  handleClose = async ev => {
    const { uiStore, open } = this.props
    if (open) {
      uiStore.closeAdminUsersMenu()
    }
  }

  togglePanel = panel => {
    this.updatePanel(panel, !this.isOpenPanel(panel))
  }

  updatePanel = (panel, isOpen) => {
    this.setState({ [`${panel}PanelOpen`]: isOpen })
  }

  isOpenPanel = panel => this.state[`${panel}PanelOpen`]

  async removeUser(user) {
    this.props.apiStore.removeShapeAdminUser(user)
  }

  render() {
    const { open } = this.props
    const title = 'Invite Shape Admin Users'

    const panel = 'active'
    const { adminUsers } = this.state
    const activeCount = adminUsers.length

    return (
      <Modal title={title} onClose={this.handleClose} open={open} noScroll>
        <React.Fragment>
          <StyledHeaderRow align="flex-end">
            <Heading3>Previously Invited</Heading3>
          </StyledHeaderRow>
          <ScrollArea>
            <div>
              <GroupHeader
                onClick={() => this.togglePanel(panel)}
                open={this.isOpenPanel(panel)}
              >
                <StyledRow align="center">
                  <DisplayText>Active Users ({activeCount})</DisplayText>
                  <RowItemLeft style={{ marginLeft: '0px' }}>
                    {this.isOpenPanel(panel) ? (
                      <StyledCollapseToggle aria-label="Collapse">
                        <DropdownIcon />
                      </StyledCollapseToggle>
                    ) : (
                      <StyledExpandToggle aria-label="Expand">
                        <DropdownIcon />
                      </StyledExpandToggle>
                    )}
                  </RowItemLeft>
                </StyledRow>
              </GroupHeader>
              <Collapse
                in={this.isOpenPanel(panel)}
                timeout="auto"
                unmountOnExit
              >
                {adminUsers.map(user => (
                  <Row key={`${user.internalType}_${user.id}`}>
                    <RowItemGrid
                      container
                      alignItems="center"
                      justify="space-between"
                    >
                      <EntityAvatarAndName
                        entity={user}
                        isJoinableGroup={false}
                      />
                    </RowItemGrid>
                    <Tooltip
                      classes={{ tooltip: 'Tooltip' }}
                      title={user.isCurrentUser ? 'Leave' : 'Remove'}
                      placement="bottom"
                    >
                      <LeaveIconHolder onClick={() => this.removeUser(user)}>
                        <LeaveIcon />
                      </LeaveIconHolder>
                    </Tooltip>
                    <LeaveIconHolder enabled={false} />
                  </Row>
                ))}
              </Collapse>
            </div>
          </ScrollArea>
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
