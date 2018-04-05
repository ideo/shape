import PropTypes from 'prop-types'
import styled from 'styled-components'
import { action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import Logo from '~/ui/layout/Logo'
import PlainLink from '~/ui/global/PlainLink'
import SearchBar from '~/ui/layout/SearchBar'
import Avatar from '~/ui/global/Avatar'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

const StyledHeader = styled.header`
  z-index: ${v.zIndex.header};
  position: fixed;
  top: 0;
  width: calc(100% - ${v.containerPadding.horizontal}*2);
  background: ${v.colors.cararra};
  padding: 1rem ${v.containerPadding.horizontal};
`

const StyledUserAndMenu = styled.div`
  display: inline-block;
  .user-avatar {
    cursor: pointer;
  }
  .user-menu {
    top: 15px;
    right: 20px;
    z-index: ${v.zIndex.aboveClickWrapper};
    .menu-toggle {
      display: none;
    }
  }
`
StyledUserAndMenu.displayName = 'StyledUserAndMenu'

const MaxWidthContainer = styled.div`
  max-width: ${v.maxWidth}px;
  margin: 0 auto;
`

// TODO trying to fix alignment issues
const MaxWidthInnerContainer = styled.div`
  max-width: 1320px;
`

@inject('apiStore')
@observer
class Header extends React.Component {
  state = {
    menuOpen: false,
  }

  @action handleOrgClick = (ev) => {
    uiStore.update('organizationMenuOpen', true)
  }

  get renderMenu() {
    const { menuOpen } = this.state
    if (!menuOpen) return ''
    return (
      <PopoutMenu
        className="user-menu"
        width={220}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.toggleUserMenu}
        menuItems={this.menuItems}
        menuOpen={menuOpen}
      />
    )
  }

  get menuItems() {
    return [
      { name: 'Account Settings', icon: <SettingsIcon />, onClick: this.handleAccountSettings },
      { name: 'Logout', icon: <LeaveIcon />, onClick: this.handleLogout }
    ]
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

  toggleUserMenu = () => {
    this.setState({ menuOpen: !this.state.menuOpen })
  }

  render() {
    const { apiStore, children } = this.props
    const { currentUser } = apiStore
    const { menuOpen } = this.state
    const primaryGroup = currentUser.current_organization.primary_group
    const clickHandlers = [
      () => this.toggleUserMenu
    ]
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
              <button onClick={this.handleOrgClick}>
                <Avatar
                  title={primaryGroup.name}
                  url={primaryGroup.filestack_file_url}
                  className="organization-avatar"
                />
              </button>
              <StyledUserAndMenu
                onClick={this.toggleUserMenu}
              >
                {this.renderMenu}
                <Avatar
                  title={currentUser.name}
                  url={currentUser.pic_url_square}
                  className="user-avatar"
                />
                {menuOpen && <ClickWrapper clickHandlers={clickHandlers} />}
              </StyledUserAndMenu>
            </Box>
          </Flex>

          <MaxWidthInnerContainer>
            { children }
          </MaxWidthInnerContainer>

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
