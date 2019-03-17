import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Fragment } from 'react'
import { observable, action, computed, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'
import Hidden from '@material-ui/core/Hidden'

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
  margin-left: 8px;
  .user-avatar,
  .organization-avatar {
    cursor: pointer;
    margin-left: 0;
    margin-right: 0;
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

const StyledSeparator = styled.div`
  width: 1px;
  height: 32px;
  background-color: ${v.colors.commonMedium};
  display: inline-block;
  margin-left: 8px;
`

const StyledRoundBtn = styled.div`
  box-sizing: border-box;
  display: inline-block;
  vertical-align: top;
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: white;
  margin: 0 0 0 8px;
  line-height: 32px;
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
`
StyledRoundBtn.displayName = 'StyledRoundBtn'

export const BasicHeader = ({ orgMenu }) => (
  <Fragment>
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
    <HeaderSpacer />
  </Fragment>
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
  @observable
  userDropdownOpen = false

  @observable
  orgDropdownOpen = false

  @observable
  actionsWidth = 0

  @observable
  breadcrumbsWidth = null

  @action
  updateActionsWidth(ref) {
    if (!ref) return
    this.actionsWidth = ref.offsetWidth
  }

  @action
  updateBreadcrumbsWidth(ref) {
    if (!ref) return
    this.breadcrumbsWidth = ref.offsetWidth
  }

  handleOrgClick = open => () =>
    runInAction(() => {
      this.orgDropdownOpen = open
    })

  handleUserClick = open => () =>
    runInAction(() => {
      this.userDropdownOpen = open
    })

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

  @action
  handleNotificationSettings = () => {
    this.props.routingStore.routeTo('/user_settings')
    this.userDropdownOpen = false
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

  get rolesSummary() {
    const { record } = this
    const { uiStore } = this.props
    if (!this.hasActions) return null
    return (
      <RolesSummary
        key="roles"
        handleClick={this.showObjectRoleDialog}
        roles={record.roles}
        canEdit={record.can_edit}
        rolesMenuOpen={!!uiStore.rolesMenuOpen}
      />
    )
  }

  get actionMenu() {
    const { record } = this
    const { uiStore } = this.props
    if (!this.hasActions) return null
    if (record.parent_collection_card) {
      // TODO hacky way to include the record on the card link
      record.parent_collection_card.record = record
      return (
        <StyledRoundBtn style={{ paddingLeft: '2px' }}>
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
        </StyledRoundBtn>
      )
    }
    return null
  }

  get renderOrgDropdown() {
    const { orgDropdownOpen } = this
    return (
      <OrganizationDropdown
        open={orgDropdownOpen}
        onItemClick={this.handleOrgClick(false)}
      />
    )
  }

  get renderUserDropdown() {
    const { userDropdownOpen } = this
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
    const { breadcrumbsWidth, record, userDropdownOpen, orgDropdownOpen } = this
    const { apiStore, routingStore, uiStore } = this.props
    const { currentUser } = apiStore
    if (!currentUser.current_organization) {
      // user needs to set up their Org, will see the Org popup before proceeding
      return <BasicHeader orgMenu={uiStore.organizationMenuOpen} />
    }
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
                <div ref={ref => this.updateBreadcrumbsWidth(ref)}>
                  {/* TODO: bug here when moving an immediate child of home collection */}
                  {record && (
                    <Flex align="center">
                      <Hidden mdUp>
                        {/* TODO: there must be a better way to have the different prop values set by breakpoint */}
                        <Box auto>
                          <Breadcrumb
                            maxDepth={1}
                            backButton
                            record={record}
                            isHomepage={routingStore.isHomepage}
                            // re-mount every time the record / breadcrumb changes
                            key={`${record.identifier}_${
                              record.breadcrumbSize
                            }`}
                            // force props update if windowWidth changes
                            windowWidth={uiStore.windowWidth}
                            containerWidth={
                              breadcrumbsWidth - this.actionsWidth
                            }
                          />
                        </Box>
                      </Hidden>
                      <Hidden smDown>
                        <Box>
                          <Breadcrumb
                            record={record}
                            isHomepage={routingStore.isHomepage}
                            // re-mount every time the record / breadcrumb changes
                            key={`${record.identifier}_${
                              record.breadcrumbSize
                            }`}
                            // force props update if windowWidth changes
                            windowWidth={uiStore.windowWidth}
                            containerWidth={
                              breadcrumbsWidth - this.actionsWidth
                            }
                          />
                        </Box>
                      </Hidden>
                      <Box>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            whiteSpace: 'nowrap',
                          }}
                          ref={ref => {
                            this.updateActionsWidth(ref)
                          }}
                        >
                          {this.actionMenu && (
                            <Fragment>
                              {this.actionMenu}
                              <Hidden smDown>
                                <StyledSeparator />
                              </Hidden>
                            </Fragment>
                          )}
                          <Hidden smDown>{this.rolesSummary}</Hidden>
                        </div>
                      </Box>
                    </Flex>
                  )}
                </div>
              </Box>

              <Box flex align="center">
                <Hidden smDown>
                  <GlobalSearch className="search-bar" />
                </Hidden>
                {record && (
                  <Hidden smDown>
                    <StyledRoundBtn>
                      <ActivityLogButton key="activity" />
                    </StyledRoundBtn>
                  </Hidden>
                )}
                <Hidden smDown>
                  <StyledAvatarAndDropdown>
                    {this.renderOrgDropdown}
                    <button
                      style={{ display: 'block' }}
                      className="orgBtn"
                      data-cy="OrgMenuBtn"
                      onClick={this.handleOrgClick(true)}
                    >
                      <Avatar
                        title={primaryGroup.name}
                        url={primaryGroup.filestack_file_url}
                        className="organization-avatar"
                        responsive={false}
                      />
                    </button>
                  </StyledAvatarAndDropdown>
                </Hidden>
                <StyledAvatarAndDropdown>
                  {this.renderUserDropdown}
                  <button
                    style={{ display: 'block' }}
                    className="userBtn"
                    onClick={this.handleUserClick(true)}
                  >
                    <Avatar
                      title={currentUser.name}
                      url={currentUser.pic_url_square}
                      className="user-avatar"
                      responsive={false}
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
