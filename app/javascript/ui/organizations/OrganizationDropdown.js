import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'

@inject('apiStore')
class OrganizationDropdown extends React.Component {
  @observable organizationPage = null

  @action openOrgMenu(page = 'base') {
    this.props.onItemClick()
    this.organizationPage = page
  }

  handleOrgPeople = (ev) => {
    this.openOrgMenu('base')
  }

  handleNewOrg = (ev) => {
    this.openOrgMenu('base')
  }

  handleOrgSettings= (ev) => {
    this.openOrgMenu('base')
  }

  get menuItems() {
    return [
      { name: 'People & Orgs', onClick: this.handleOrgPeople },
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
          menuOpen
        />
        { this.organizationPage && (
          <OrganizationMenu
            organization={apiStore.currentUser.current_organization}
            userGroups={apiStore.currentUser.groups}
            initialPage={this.organizationPage}
          />
        )}
      </div>
    )
  }
}

OrganizationDropdown.propTypes = {
  onItemClick: PropTypes.func.isRequired,
}
OrganizationDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationDropdown
