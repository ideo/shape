import _ from 'lodash'
import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'

import Avatar from '~/ui/global/Avatar'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import SearchBar from '~/ui/layout/SearchBar'

const MAX_ORGS_IN_LIST = 10

const IconHolder = styled.span`
  .org_avatar {
    display: inline-block;
    margin-bottom: 7px;
    margin-left: 0;
    margin-right: 15px;
    margin-top: 7px;
    vertical-align: middle;
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

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class OrganizationDropdown extends React.Component {
  @observable
  searchText = ''

  constructor(props) {
    super(props)
    this.searchOrganizations = _.debounce(this._searchOrganizations, 300)
  }

  openOrgMenu = (page = 'organizationPeople') => {
    this.props.uiStore.update('organizationMenuPage', page)
    // then close dropdown
    this.props.onItemClick()
  }

  closeOrgMenu = () => {
    this.props.uiStore.update('organizationMenuPage', null)
  }

  handleOrgPeople = ev => {
    this.openOrgMenu('organizationPeople')
  }

  handleNewOrg = ev => {
    this.openOrgMenu('newOrganization')
  }

  handleSwitchOrg = orgId => ev => {
    ev.preventDefault()
    const { apiStore, uiStore, onItemClick } = this.props
    // close the menu
    onItemClick()
    const switchOrg = () => {
      apiStore.currentUser.switchOrganization(orgId, {
        redirectPath: 'homepage',
      })
    }
    if (uiStore.isMovingCards) {
      const currentOrgName = apiStore.currentUserOrganization.name
      const otherOrgName = apiStore.findOrganizationById(orgId).name

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

  handleOrgSettings = ev => {
    this.props.onItemClick()
    this.props.routingStore.routeTo('/settings')
  }

  handleBilling = ev => {
    this.props.onItemClick()
    this.props.routingStore.routeTo('/billing')
  }

  handleLegal = ev => {
    this.props.onItemClick()
    this.props.routingStore.routeTo('/terms')
  }

  handleZendesk = ev => {
    const { zE } = window
    this.props.onItemClick()
    if (zE && zE.activate) {
      zE.activate({ hideOnClose: true })
    }
  }

  handleSearchChange = text => {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    runInAction(() => {
      this.searchText = text
    })
    if (currentUser.is_super_admin) {
      this.searchOrganizations()
    }
  }

  async _searchOrganizations() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const res = await apiStore.searchOrganizations(
      this.searchText.toLowerCase()
    )
    runInAction(() => {
      currentUser.organizations.replace(res.data)
    })
  }

  clearSearch = () => {
    runInAction(() => {
      this.searchText = ''
    })
  }

  get organizationItems() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const orgItems = currentUser.organizations
      .filter(org => org.id !== this.currentOrganization.id)
      .sort((orgA, orgB) => orgA.name.localeCompare(orgB.name))
      .filter(org => {
        if (this.searchText === '' || currentUser.is_super_admin) return org
        return fuzzyMatch(org.name.toLowerCase(), this.searchText.toLowerCase())
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
          onClick: this.handleSwitchOrg(org.id),
          noBorder: true,
        }
      })
    return orgItems
  }

  get currentOrganization() {
    // Alias to often used property
    return this.props.apiStore.currentUser.current_organization
  }

  get menuItems() {
    const userCanEdit = this.currentOrganization.primary_group.can_edit
    const items = {
      top: [{ name: 'People & Groups', onClick: this.handleOrgPeople }],
      organizations: [...this.organizationItems],
      bottom: [
        { name: 'New Organization', onClick: this.handleNewOrg },
        { name: 'Contact Support', onClick: this.handleZendesk },
        { name: 'Legal', onClick: this.handleLegal },
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

  render() {
    const { apiStore, uiStore } = this.props
    const { currentUser } = apiStore
    return (
      <div>
        <TruncatedPopoutMenu
          className="org-menu"
          width={220}
          groupedMenuItems={this.menuItems}
          menuOpen={this.props.open}
          hideDotMenu
          groupExtraComponent={{
            organizations: (currentUser.is_super_admin ||
              currentUser.organizations.length > MAX_ORGS_IN_LIST) && (
              <StyledSearchHolder>
                <SearchBar
                  value={this.searchText}
                  onChange={this.handleSearchChange}
                  onClear={this.clearSearch}
                />
              </StyledSearchHolder>
            ),
          }}
        />
        <OrganizationMenu
          organization={this.currentOrganization}
          userGroups={apiStore.currentUser.groups}
          onClose={this.closeOrgMenu}
          open={uiStore.organizationMenuOpen}
        />
      </div>
    )
  }
}

OrganizationDropdown.propTypes = {
  open: PropTypes.bool,
  onItemClick: PropTypes.func.isRequired,
}
OrganizationDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationDropdown.defaultProps = {
  open: false,
}

export default OrganizationDropdown
