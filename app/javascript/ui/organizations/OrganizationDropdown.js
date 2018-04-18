import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'
import { observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import { uiStore } from '~/stores'

@inject('apiStore')
class OrganizationDropdown extends React.Component {
  @observable organizationPage = 'base'

  handleOrgPeople = (ev) => {
    this.props.onItemClick(ev)
    uiStore.update('organizationMenuOpen', true)
  }

  handleNewOrg = (ev) => {
    this.props.onItemClick(ev)
    uiStore.update('organizationMenuOpen', true)
  }

  handleOrgSettings= (ev) => {
    this.props.onItemClick(ev)
    uiStore.update('organizationMenuOpen', true)
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
        <OrganizationMenu
          organization={apiStore.currentUser.current_organization}
          userGroups={apiStore.currentUser.groups}
        />
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
