import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { withRouter } from 'react-router-dom'
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

@withRouter
@inject('apiStore', 'uiStore')
@observer
class OrganizationDropdown extends React.Component {
  openOrgMenu = (page = 'organizationPeople') => {
    this.props.uiStore.update('organizationMenuPage', page)
    // then close dropdown
    this.props.onItemClick()
  }

  closeOrgMenu = () => {
    this.props.uiStore.update('organizationMenuPage', null)
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

  handleOrgSettings = (ev) => {
    this.openOrgMenu('editOrganization')
  }

  handleLegal = (ev) => {
    this.props.onItemClick()
    this.props.history.push('/terms')
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
      { name: 'New Organization', onClick: this.handleNewOrg },
      ...(userCanEdit
        ? [{ name: 'Setings', onClick: this.handleOrgSettings }]
        : []),
      { name: 'Legal', onClick: this.handleLegal },
    ]
    return items
  }

  render() {
    const { apiStore, uiStore } = this.props
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
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired
}
OrganizationDropdown.defaultProps = {
  open: false,
}

export default OrganizationDropdown
