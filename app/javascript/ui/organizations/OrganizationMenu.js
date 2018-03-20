import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Row } from '~/ui/global/styled/layout'
import { Heading3, DisplayText, TextButton } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/Modal'
import OrganizationEdit from './OrganizationEdit'

@inject('uiStore')
@observer
class OrganizationMenu extends React.Component {
  @action onGroupSave = () => {
    this.editGroup = {}
  }

  @action onOrganizationSave = () => {
    this.editOrganizationOpen = false
  }

  @action handleGroupClick = group => () => {
    this.editGroup = group
  }

  @action handleOrganizationClick = () => {
    if (!this.editOrganization) {
      this.editOrganizationOpen = true
    }
  }

  @action handleGroupAddClick = (ev) => {
    this.addGroupOpen = true
  }

  @observable editOrganizationOpen = null;

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeOrganizationMenu()
  }

  @observable editOrganizationOpen = false
  @observable addGroupOpen = false
  @observable editGroup = {}

  renderEditOrganization() {
    const { organization } = this.props
    return (
      <OrganizationEdit
        onSave={this.onSave}
        organization={organization}
      />
    )
  }

  renderEditGroup() {
    return (
      <GroupModify group={this.editGroup} onSave={this.onGroupSave} />
    )
  }

  renderBase() {
    const { organization, userGroups } = this.props
    return (
      <div>
        <Row>
          <TextButton onClick={this.handleGroupAddClick}>
            + New Group
          </TextButton>
        </Row>
        <Heading3>
          Your Organization
        </Heading3>
        <Row>
          <button className="orgEdit" onClick={this.handleOrganizationClick}>
            <DisplayText>{ organization.name }</DisplayText>
          </button>
        </Row>
        <Heading3>
          Your Groups
        </Heading3>
        { userGroups.map((group) =>
          (<Row key={group.id}>
            <button
              className="groupEdit"
              onClick={this.handleGroupClick(group)}
            >
              <DisplayText>{group.name}</DisplayText>
            </button>
          </Row>))
        }
      </div>
    )
  }

  render() {
    const { uiStore } = this.props
    let content = this.renderBase()
    if (this.editOrganizationOpen) {
      content = this.renderEditOrganization()
    } else if (this.addGroupOpen) {
      content = this.renderEditGroup()
    }
    // TODO correct title for each 3 states
    return (
      <Modal
        title={this.editOrganizationOpen
          ? 'Your Organization'
          : 'People & Groups'}
        onClose={this.handleClose}
        open={uiStore.organizationMenuOpen}
      >
        { content }
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
