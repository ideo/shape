import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'
import styled from 'styled-components'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import Avatar from '~/ui/global/Avatar'

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

@inject('apiStore')
@observer
class OrganizationDropdown extends React.Component {
  @observable organizationPage = null

  @action openOrgMenu(page = OrganizationMenu.defaultProps.initialPage) {
    this.props.onItemClick()
    this.organizationPage = page
  }

  @action closeOrgMenu = () => {
    this.organizationPage = null
  }

  handleOrgPeople = (ev) => {
    this.openOrgMenu('organizationPeople')
  }

  handleNewOrg = (ev) => {
    console.warn('unimplemented')
  }

  handleSwitchOrg = (ev) => {
    console.warn('unimplemented')
  }

  handleOrgSettings= (ev) => {
    this.openOrgMenu('editOrganization')
  }

  get organizationItems() {
    const { apiStore } = this.props
    return apiStore.currentUser.organizations
      .filter(org => org.id !== this.currentOrganization.id)
      .map(org => {
        const avatar = (
          <IconHolder>
            <Avatar
              title={org.name}
              url={org.primary_group.filestack_file_url}
              size={32}
              className="org_avatar"
            />
          </IconHolder>
        )
        return {
          name: org.name,
          iconLeft: avatar,
          onClick: this.handleSwitchOrg,
          noBorder: true,
        }
      })
  }

  get currentOrganization() {
    // Alias to often used property
    return this.props.apiStore.currentUser.current_organization
  }

  get menuItems() {
    const userCanEdit = this.currentOrganization.primary_group.currentUserCanEdit
    const items = [
      { name: 'People & Groups', onClick: this.handleOrgPeople },
      ...this.organizationItems,
      { name: '+ New Organization', onClick: this.handleNewOrg },
    ]
    if (userCanEdit) {
      items.push({ name: 'Settings', onClick: this.handleOrgSettings })
    }
    return items
  }

  render() {
    const { apiStore } = this.props
    return (
      <div>
        <PopoutMenu
          className="org-menu"
          width={220}
          menuItems={this.menuItems}
          menuOpen={this.props.open}
        />
        <OrganizationMenu
          organization={this.currentOrganization}
          userGroups={apiStore.currentUser.groups}
          initialPage={this.organizationPage}
          onClose={this.closeOrgMenu}
          open={!!this.organizationPage}
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
}
OrganizationDropdown.defaultProps = {
  open: false,
}

export default OrganizationDropdown
