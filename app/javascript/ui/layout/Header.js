import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import SearchBar from '~/ui/layout/SearchBar'
import Avatar from '~/ui/global/Avatar'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import OrganizationDropdown from '~/ui/organizations/OrganizationDropdown'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import v from '~/utils/variables'

/* global IdeoSSO */

const StyledHeader = styled.header`
  z-index: ${v.zIndex.header};
  position: fixed;
  top: 0;
  width: calc(100% - ${v.containerPadding.horizontal}*2);
  background: ${v.colors.cararra};
  padding: 1rem ${v.containerPadding.horizontal};
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

const MaxWidthContainer = styled.div`
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
`

// TODO trying to fix alignment issues
// const MaxWidthInnerContainer = styled.div`
//   max-width: 1320px;
// `

@inject('apiStore')
@observer
class Header extends React.Component {
  state = {
    userDropdownOpen: false,
    orgDropdownOpen: false,
  }

  handleOrgClick = (open) => () => {
    this.setState({ orgDropdownOpen: open })
  }

  handleUserClick = (open) => () => {
    this.setState({ userDropdownOpen: open })
  }

  handleAccountSettings = () => {
    window.open(IdeoSSO.getSettingsUrl(), '_blank')
  }

  handleLogout = async () => {
    const { apiStore } = this.props
    await apiStore.request('/sessions', 'DELETE')
    // Log user out of IDEO network
    // Redirec to /login once done
    IdeoSSO.logout('/login')
  }

  get clickHandlers() {
    return [
      this.handleUserClick(false),
      this.handleOrgClick(false),
    ]
  }

  get userMenuItems() {
    return [
      { name: 'Account Settings', icon: <SettingsIcon />, onClick: this.handleAccountSettings },
      { name: 'Logout', icon: <LeaveIcon />, onClick: this.handleLogout }
    ]
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
      />
    )
  }

  render() {
    const { apiStore, children } = this.props
    const { currentUser } = apiStore
    const { userDropdownOpen, orgDropdownOpen } = this.state
    const primaryGroup = currentUser.current_organization.primary_group
    return (
      <StyledHeader>
        <MaxWidthContainer>

          <Flex align="center" justify="space-between">
            <Box>
              <PlainLink to="/">
                <Logo />
              </PlainLink>
            </Box>

            <Box flex>
              <SearchBar className="search-bar" />
              <StyledAvatarAndDropdown>
                {this.renderOrgDropdown}
                <button className="orgBtn" onClick={this.handleOrgClick(true)}>
                  <Avatar
                    title={primaryGroup.name}
                    url={primaryGroup.filestack_file_url}
                    className="organization-avatar"
                  />
                </button>
              </StyledAvatarAndDropdown>
              <StyledAvatarAndDropdown>
                {this.renderUserDropdown}
                <button className="userBtn" onClick={this.handleUserClick(true)}>
                  <Avatar
                    title={currentUser.name}
                    url={currentUser.pic_url_square}
                    className="user-avatar"
                  />
                </button>
              </StyledAvatarAndDropdown>
              {(userDropdownOpen || orgDropdownOpen) &&
                <ClickWrapper clickHandlers={this.clickHandlers} />}
            </Box>
          </Flex>
          <div>
            { children }
          </div>
        </MaxWidthContainer>
      </StyledHeader>
    )
  }
}

Header.propTypes = {
  children: PropTypes.node,
}
Header.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
Header.defaultProps = {
  children: null,
}

export default Header
