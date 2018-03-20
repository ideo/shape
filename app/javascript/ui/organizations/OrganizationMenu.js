import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Row } from '~/ui/global/styled/layout'
import { Heading3, DisplayText } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/Modal'
import OrganizationEdit from './OrganizationEdit'

@inject('uiStore')
@observer
class OrganizationMenu extends React.Component {
  @action
  onSave = () => {
    this.editOrganizationOpen = false
  }

  @action
  handleOrganizationClick = () => {
    if (!this.editOrganization) {
      this.editOrganizationOpen = true
    }
  }

  @observable editOrganizationOpen = null;

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeOrganizationMenu()
  }

  renderEditOrganization() {
    const { organization } = this.props
    return (
      <OrganizationEdit
        onSave={this.onSave}
        organization={organization}
      />
    )
  }

  render() {
    const { organization, uiStore } = this.props
    let content = (
      <div>
        <Heading3>Your Organization</Heading3>
        <Row>
          <button className="orgEdit" onClick={this.handleOrganizationClick}>
            <DisplayText>{ organization.name }</DisplayText>
          </button>
        </Row>
      </div>
    )
    if (this.editOrganizationOpen) {
      content = this.renderEditOrganization()
    }
    return (
      <Modal
        title={this.editOrganizationOpen
          ? 'Your Organization'
          : 'People & Groups'}
        onClose={this.handleClose}
        open={uiStore.organizationMenuOpen}
      >
        { content}
      </Modal>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationMenu
