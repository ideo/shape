import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Fragment } from 'react'
import { observable, action, computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Breadcrumb from '~/ui/layout/Breadcrumb'
import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import GlobalSearch from '~/ui/layout/GlobalSearch'
import Avatar from '~/ui/global/Avatar'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import ActionMenu from '~/ui/grid/ActionMenu'
import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import RolesSummary from '~/ui/roles/RolesSummary'
import OrganizationDropdown from '~/ui/organizations/OrganizationDropdown'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import { FixedHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'

/* global IdeoSSO */

const HeaderSpacer = styled.div`
  height: ${v.headerHeight}px;
`

const StyledAvatarAndDropdown = styled.div`
  display: inline-block;
  .user-avatar,
  .org-avatar {
    cursor: pointer;
  }
  .user-menu,
  .org-menu {
    top: 15px;
    right: 20px;
    z-index: ${v.zIndex.aboveClickWrapper};
    .menu-toggle {
      display: none;
    }
  }
`
StyledAvatarAndDropdown.displayName = 'StyledAvatarAndDropdown'

export const BasicHeader = ({ orgMenu }) => (
  <FixedHeader zIndex={v.zIndex.globalHeader}>
    <MaxWidthContainer>
      <Flex align="center" justify="space-between">
        <Box>
          <PlainLink to="/">
            <Logo />
          </PlainLink>
        </Box>
      </Flex>
      {orgMenu && (
        <OrganizationMenu
          organization={{}}
          userGroups={[]}
          onClose={() => null}
          open={orgMenu}
          locked
        />
      )}
    </MaxWidthContainer>
  </FixedHeader>
)
BasicHeader.propTypes = {
  orgMenu: PropTypes.bool,
}
BasicHeader.defaultProps = {
  orgMenu: false,
}

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class Header extends React.Component {
  // TODO: Should this state be turned into mobx observables?
  state = {
    userDropdownOpen: false,
    orgDropdownOpen: false,
  }

  @observable
  actionsWidth = 0

  @action
  updateActionsWidth(ref) {
    if (!ref) return
    this.actionsWidth = ref.offsetWidth
  }

  handleOrgClick = open => () => {
    this.setState({ orgDropdownOpen: open })
  }

  handleUserClick = open => () => {
    this.setState({ userDropdownOpen: open })
  }

  handleMyProfile = () => {
    const { apiStore, routingStore } = this.props
    routingStore.routeTo(
      'collections',
      apiStore.currentUser.user_profile_collection_id
    )
  }

  handleAccountSettings = () => {
    window.open(IdeoSSO.profileUrl, '_blank')
  }

  handleNotificationSettings = () => {
    this.props.routingStore.routeTo('/user_settings')
    this.setState({ userDropdownOpen: false })
  }

  handleLogout = () => {
    const { apiStore } = this.props
    apiStore.currentUser.logout()
  }

  showObjectRoleDialog = () => {
    const { record } = this
    const { uiStore } = this.props
    uiStore.update('rolesMenuOpen', record)
  }

  openMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', true)
  }

  closeMenu = () => {
    const { uiStore } = this.props
    uiStore.update('pageMenuOpen', false)
  }

  routeBack = ({ type } = {}) => {
    const { record } = this
    const { routingStore } = this.props
    if (
      record.internalType === 'items' ||
      type === 'move' ||
      type === 'archive'
    ) {
      if (record.parent_collection_card.parent_id) {
        routingStore.routeTo(
          'collections',
          record.parent_collection_card.parent_id
        )
      } else {
        routingStore.routeTo('homepage')
      }
    }
  }

  get clickHandlers() {
    return [this.handleUserClick(false), this.handleOrgClick(false)]
  }

  get userMenuItems() {
    const { apiStore } = this.props
    const items = [
      {
        name: 'Account Settings',
        icon: <SettingsIcon />,
        onClick: this.handleAccountSettings,
      },
      {
        name: 'Notification Settings',
        icon: <SettingsIcon />,
        onClick: this.handleNotificationSettings,
      },
      { name: 'Logout', icon: <LeaveIcon />, onClick: this.handleLogout },
    ]
    if (apiStore.currentUser.user_profile_collection_id) {
      items.unshift({
        name: 'My Profile',
        icon: <ProfileIcon />,
        onClick: this.handleMyProfile,
      })
    }
    return items
  }

  get hasActions() {
    const { record } = this
    return (
      record.internalType === 'items' ||
      (!record.isUserCollection && !record.isSharedCollection)
    )
  }

  get actions() {
    const { record } = this
    const { uiStore } = this.props
    const elements = []
    // 1. RolesSummary
    if (this.hasActions) {
      elements.push(
        <RolesSummary
          key="roles"
          handleClick={this.showObjectRoleDialog}
          roles={record.roles}
          canEdit={record.can_edit}
          rolesMenuOpen={!!uiStore.rolesMenuOpen}
        />
      )
    }
    // 2. CommentIcon (toggle ActivityLog)
    elements.push(<ActivityLogButton key="activity" />)
    if (this.hasActions && record.parent_collection_card) {
      // TODO hacky way to include the record on the card link
      record.parent_collection_card.record = record
      // 3. ActionMenu actions
      elements.push(
        <ActionMenu
          key="action-menu"
          location="PageMenu"
          className="card-menu"
          card={record.parent_collection_card}
          canEdit={record.can_edit}
          canReplace={record.canReplace}
          submissionBox={record.isSubmissionBox}
          menuOpen={uiStore.pageMenuOpen}
          onOpen={this.openMenu}
          onLeave={this.closeMenu}
          onMoveMenu={this.routeBack}
          afterArchive={this.routeBack}
        />
      )
    }
    return elements
  }

  get renderOrgDropdown() {
    const { orgDropdownOpen } = this.state
    return (
      <OrganizationDropdown
        open={orgDropdownOpen}
        onItemClick={this.handleOrgClick(false)}
      />
    )
  }

  get renderUserDropdown() {
    const { userDropdownOpen } = this.state
    if (!userDropdownOpen) return ''
    return (
      <PopoutMenu
        className="user-menu"
        width={220}
        menuItems={this.userMenuItems}
        menuOpen={userDropdownOpen}
        hideDotMenu
      />
    )
  }

  @computed
  get record() {
    const { uiStore } = this.props
    return uiStore.viewingCollection || uiStore.viewingItem
  }

  render() {
    const { record } = this
    const { apiStore, routingStore, uiStore } = this.props
    const { currentUser } = apiStore
    if (!currentUser.current_organization) {
      // user needs to set up their Org, will see the Org popup before proceeding
      return <BasicHeader orgMenu={uiStore.organizationMenuOpen} />
    }
    const { userDropdownOpen, orgDropdownOpen } = this.state
    const primaryGroup = currentUser.current_organization.primary_group
    return (
      <Fragment>
        <FixedHeader zIndex={v.zIndex.globalHeader}>
          <MaxWidthContainer>
            <Flex align="center" style={{ minHeight: v.headerHeight }}>
              <Box style={{ paddingRight: '12px' }}>
                <PlainLink to={routingStore.pathTo('homepage')}>
                  <Logo noText width={46} />
                </PlainLink>
              </Box>

              <Box auto>
                {/* TODO: bug here when moving an immediate child of home collection */}
                {record && (
                  <Flex align="center">
                    <Box>
                      <Breadcrumb
                        record={record}
                        isHomepage={routingStore.isHomepage}
                        // re-mount every time the record / breadcrumb changes
                        key={`${record.identifier}_${record.breadcrumbSize}`}
                        // force props update if windowWidth changes
                        windowWidth={uiStore.windowWidth}
                      />
                    </Box>
                    <Box>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          whiteSpace: 'nowrap',
                          height: '60px',
                          marginTop: '-12px',
                        }}
                        ref={ref => {
                          this.updateActionsWidth(ref)
                        }}
                      >
                        {this.actions}
                      </div>
                    </Box>
                  </Flex>
                )}
              </Box>

              <Box flex>
                <GlobalSearch className="search-bar" />
                <StyledAvatarAndDropdown>
                  {this.renderOrgDropdown}
                  <button
                    className="orgBtn"
                    data-cy="OrgMenuBtn"
                    onClick={this.handleOrgClick(true)}
                  >
                    <Avatar
                      title={primaryGroup.name}
                      url={primaryGroup.filestack_file_url}
                      className="organization-avatar"
                    />
                  </button>
                </StyledAvatarAndDropdown>
                <StyledAvatarAndDropdown>
                  {this.renderUserDropdown}
                  <button
                    className="userBtn"
                    onClick={this.handleUserClick(true)}
                  >
                    <Avatar
                      title={currentUser.name}
                      url={currentUser.pic_url_square}
                      className="user-avatar"
                    />
                  </button>
                </StyledAvatarAndDropdown>
                {(userDropdownOpen || orgDropdownOpen) && (
                  <ClickWrapper clickHandlers={this.clickHandlers} />
                )}
              </Box>
            </Flex>
          </MaxWidthContainer>
        </FixedHeader>
        <HeaderSpacer />
      </Fragment>
    )
  }
}

Header.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Header
