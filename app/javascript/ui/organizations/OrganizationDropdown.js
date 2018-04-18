import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import Avatar from '~/ui/global/Avatar'

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

  handleOrgSettings= (ev) => {
    this.openOrgMenu('editOrganization')
  }

  get organizationItems() {
    const { apiStore } = this.props
    return apiStore.currentUser.organizations.map(org => {
      const avatar = (
        <Avatar
          title={org.name}
          url={org.filestack_file_url}
          size={32}
          className="org_list_item"
        />
      )
      return { name: org.name, icon: avatar }
    })
  }

  get menuItems() {
    return [
      { name: 'People & Orgs', onClick: this.handleOrgPeople },
      ...this.organizationItems,
      { name: 'New Organization', onClick: this.handleNewOrg },
      { name: 'Setings', onClick: this.handleOrgSettings },
    ]
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
          organization={apiStore.currentUser.current_organization}
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
