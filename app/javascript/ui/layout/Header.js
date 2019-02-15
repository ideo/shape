import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import GlobalSearch from '~/ui/layout/GlobalSearch'
import Avatar from '~/ui/global/Avatar'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import OrganizationDropdown from '~/ui/organizations/OrganizationDropdown'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import { FixedHeader, MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

/* global IdeoSSO */

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

@inject('apiStore', 'routingStore')
@observer
class Header extends React.Component {
  state = {
    userDropdownOpen: false,
    orgDropdownOpen: false,
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

  render() {
    const { apiStore, routingStore } = this.props
    const { currentUser } = apiStore
    if (!currentUser.current_organization) {
      // user needs to set up their Org, will see the Org popup before proceeding
      return <BasicHeader orgMenu={uiStore.organizationMenuOpen} />
    }
    const { userDropdownOpen, orgDropdownOpen } = this.state
    const primaryGroup = currentUser.current_organization.primary_group
    return (
      <FixedHeader zIndex={v.zIndex.globalHeader}>
        <MaxWidthContainer>
          <Flex align="center" justify="space-between">
            <Box>
              <PlainLink to={routingStore.pathTo('homepage')}>
                <Logo />
              </PlainLink>
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
    )
  }
}

Header.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Header
