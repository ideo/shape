import PropTypes from 'prop-types'
import PopoutMenu from '~/ui/global/PopoutMenu'

class OrganizationDropdown extends React.Component {
  handleOrgPeople = (ev) => {

  }

  handleNewOrg = (ev) => {

  }

  handleOrgSettings= (ev) => {

  }

  get menuItems() {
    return [
      { name: 'People & Orgs', onClick: this.handleOrgPeople },
      { name: 'New Organization', onClick: this.handleNewOrg },
      { name: 'Setings', onClick: this.handleOrgSettings },
    ]
  }

  render() {
    return (
      <PopoutMenu
        className="org-menu"
        width={220}
        menuItems={this.menuItems}
        menuOpen
      />
    )
  }
}

OrganizationDropdown.propTypes = {
}

export default OrganizationDropdown
