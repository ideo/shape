import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'

import Avatar from '~/ui/global/Avatar'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import SearchBar from '~/ui/layout/SearchBar'

export const CONTEXT_USER = 'user'
export const CONTEXT_ORG = 'org'
export const CONTEXT_COMBO = 'combo'
export const CONTEXT_ADMIN = 'admin'
const MAX_ORGS_IN_LIST = 10

const IconHolder = styled.span`
  .org_avatar {
    left: 6px;
    top: 50%;
    transform: translateY(-50%);
    position: absolute;
    line-height: 1.4rem;
  }
`
IconHolder.displayName = 'StyledIconHolder'

const TruncatedPopoutMenu = styled(PopoutMenu)`
  .organizations {
    max-height: 60vh;
    overflow-y: scroll;
    overflow-x: hidden;
  }
`

const StyledSearchHolder = styled.div`
  padding: 10px;
`

function fuzzyMatch(str, pattern) {
  const rx = pattern.split('').reduce((a, b) => `${a}.*${b}`)
  return new RegExp(rx).test(str)
}

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class MainMenuDropdown extends React.Component {
  @observable
  orgSearchText = ''

  @observable
  open = false

  constructor(props) {
    super(props)
    this.searchOrganizations = _.debounce(this._searchOrganizations, 300)
  }

  handleOrgPeople = ev => {
    this.props.uiStore.update('organizationMenuPage', 'organizationPeople')
  }

  handleNewOrg = ev => {
    this.props.uiStore.update('organizationMenuPage', 'newOrganization')
  }

  handleOrgSettings = ev => {
    this.props.routingStore.routeTo('/settings')
  }

  handleSearch = ev => {
    this.props.routingStore.routeTo('search')
  }

  handleBilling = ev => {
    this.props.routingStore.routeTo('/billing')
  }

  handleTerms = ev => {
    this.props.routingStore.routeTo('/terms')
  }

  handlePrivacy = ev => {
    window.open('https://www.ideo.com/privacy', '_blank')
  }

  handleZendesk = ev => {
    const { zE } = window
    if (zE && zE.activate) {
      zE.activate({ hideOnClose: true })
    }
  }

  handleSwitchOrg = organization => ev => {
    ev.preventDefault()
    const { apiStore, uiStore, routingStore } = this.props
    const switchOrg = () => {
      routingStore.routeTo(`/${organization.slug}`)
    }
    if (uiStore.isMovingCards) {
      const currentOrgName = apiStore.currentUserOrganization.name
      const otherOrgName = apiStore.findOrganizationById(organization.id).name

      uiStore.confirm({
        iconName: 'Alert',
        prompt: 'You can only link or duplicate content between organizations.',
        onConfirm: () => {
          switchOrg()
          uiStore.closeMoveMenu()
        },
        cancelText: `Move within ${currentOrgName}`,
        confirmText: `Switch to ${otherOrgName}`,
      })
      return
    }
    switchOrg()
  }

  async _searchOrganizations() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const res = await apiStore.searchOrganizations(
      this.orgSearchText.toLowerCase()
    )
    runInAction(() => {
      currentUser.organizations.replace(res.data)
    })
  }

  handleOrgSearchChange = text => {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    runInAction(() => {
      this.orgSearchText = text
    })
    if (currentUser.is_super_admin) {
      this.searchOrganizations()
    }
  }

  clearOrgSearch = () => {
    runInAction(() => {
      this.orgSearchText = ''
    })
  }

  get userMenuGroups() {
    const { apiStore, routingStore } = this.props
    const items = {
      main: [
        {
          name: 'Account Settings',
          icon: <SettingsIcon />,
          onClick: () => {
            window.open(IdeoSSO.profileUrl, '_blank')
          },
        },
        {
          name: 'Notification Settings',
          icon: <SettingsIcon />,
          onClick: () => {
            routingStore.routeTo('/user_settings')
          },
        },
        {
          name: 'Logout',
          icon: <LeaveIcon />,
          onClick: () => {
            apiStore.currentUser.logout()
          },
        },
      ],
    }
    if (apiStore.currentUser.user_profile_collection_id) {
      items.main.unshift({
        name: 'My Profile',
        icon: <ProfileIcon />,
        onClick: () => {
          routingStore.routeTo(
            'collections',
            apiStore.currentUser.user_profile_collection_id
          )
        },
      })
    }
    return items
  }

  get orgMenuGroups() {
    const userCanEdit = this.currentOrganization.primary_group.can_edit
    const items = {
      top: [{ name: 'People & Groups', onClick: this.handleOrgPeople }],
      organizations: [...this.organizationItems],
      bottom: [
        { name: 'New Organization', onClick: this.handleNewOrg },
        { name: 'Contact Support', onClick: this.handleZendesk },
        { name: 'Terms of Use', onClick: this.handleTerms },
        { name: 'Privacy Policy', onClick: this.handlePrivacy },
      ],
    }
    // splice these into the correct placement
    if (userCanEdit) {
      items.bottom.splice(1, 0, {
        name: 'Settings',
        onClick: this.handleOrgSettings,
      })
      items.bottom.splice(3, 0, {
        name: 'Billing',
        onClick: this.handleBilling,
      })
    }
    return items
  }

  get currentOrganization() {
    // Alias to often used property
    return this.props.apiStore.currentUserOrganization
  }

  get organizationItems() {
    const { apiStore, showCurrentOrg } = this.props
    const { currentUser } = apiStore
    let orgs = currentUser.organizations
    if (!showCurrentOrg) {
      orgs = orgs.filter(org => org.id !== this.currentOrganization.id)
    }
    const orgItems = orgs
      .sort((orgA, orgB) => orgA.name.localeCompare(orgB.name))
      .filter(org => {
        if (this.orgSearchText === '' || currentUser.is_super_admin) return org
        return fuzzyMatch(
          org.name.toLowerCase(),
          this.orgSearchText.toLowerCase()
        )
      })
      .slice(0, MAX_ORGS_IN_LIST)
      .map(org => {
        const avatar = (
          <IconHolder>
            <Avatar
              title={org.primary_group.name}
              url={org.primary_group.filestack_file_url}
              className="org_avatar"
            />
          </IconHolder>
        )
        return {
          id: org.id,
          name: org.primary_group.name,
          iconLeft: avatar,
          withAvatar: true,
          onClick: this.handleSwitchOrg(org),
          noBorder: true,
        }
      })
    return orgItems
  }

  get orgExtras() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const extras = {}
    if (
      currentUser.is_super_admin ||
      currentUser.organizations.length > MAX_ORGS_IN_LIST
    ) {
      extras.organizations = (
        <StyledSearchHolder>
          <SearchBar
            value={this.orgSearchText}
            onChange={this.handleOrgSearchChange}
            onClear={this.clearOrgSearch}
          />
        </StyledSearchHolder>
      )
    }
    return extras
  }

  get adminMenuGroups() {
    const { uiStore } = this.props
    return {
      admin: [
        {
          name: 'Invite Shape Admins',
          icon: '+',
          onClick: () => {
            uiStore.update('adminUsersMenuOpen', true)
          },
        },
      ],
    }
  }

  get menuItems() {
    const { context, onItemClick } = this.props
    const onItemClickWrapper = cb => e => {
      cb(e)
      onItemClick && onItemClick(e)
    }

    const menuItems = {}

    if (context === CONTEXT_USER) {
      Object.assign(menuItems, this.userMenuGroups)
    } else if (context === CONTEXT_ORG) {
      Object.assign(menuItems, this.orgMenuGroups)
    } else if (context === CONTEXT_ADMIN) {
      Object.assign(menuItems, this.adminMenuGroups)
      Object.assign(menuItems, this.userMenuGroups)
    } else {
      Object.assign(menuItems, this.orgMenuGroups)
      Object.assign(menuItems, this.userMenuGroups)
    }
    if (this.props.uiStore.isMobileXs && context !== CONTEXT_ADMIN) {
      menuItems.top = menuItems.top || []
      menuItems.top.splice(0, 0, {
        name: 'Search',
        onClick: this.handleSearch,
      })
    }

    // Call the onItemClick event for any item that has a click handler
    Object.keys(menuItems).forEach(group => {
      menuItems[group].forEach(item => {
        if (item.onClick) {
          item.onClick = onItemClickWrapper(item.onClick)
        }
      })
    })

    return menuItems
  }

  get groupExtras() {
    const { context } = this.props
    const extras = {}
    if (context === CONTEXT_ORG || context === CONTEXT_COMBO) {
      Object.assign(extras, this.orgExtras)
    }
    return extras
  }

  render() {
    const { context, open } = this.props
    const className = `${context}-menu`.toLowerCase()
    return (
      <TruncatedPopoutMenu
        className={className}
        width={220}
        groupedMenuItems={this.menuItems}
        menuOpen={open}
        hideDotMenu
        groupExtraComponent={this.groupExtras}
      />
    )
  }
}

MainMenuDropdown.displayName = 'MainMenuDropdown'

MainMenuDropdown.propTypes = {
  context: PropTypes.string.isRequired,
  onItemClick: PropTypes.func,
  open: PropTypes.bool,
  showCurrentOrg: PropTypes.bool,
}

MainMenuDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

MainMenuDropdown.defaultProps = {
  onItemClick: null,
  open: false,
  showCurrentOrg: false,
}

export default MainMenuDropdown
