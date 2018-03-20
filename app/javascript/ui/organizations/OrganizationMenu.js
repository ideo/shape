import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { TextButton } from '~/ui/global/styled/forms'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import { Heading3, DisplayText } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/Modal'
import GroupModify from '~/ui/groups/GroupModify'
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

  @action handleBack = () => {
    this.editOrganizationOpen = false
    this.addGroupOpen = false
    this.editGroup = {}
  }

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
          <RowItemRight>
            <TextButton onClick={this.handleGroupAddClick}>
              + New Group
            </TextButton>
          </RowItemRight>
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
    let title = 'People & Groups'
    if (this.editOrganizationOpen) {
      content = this.renderEditOrganization()
      title = 'Your Organization'
    } else if (this.addGroupOpen) {
      content = this.renderEditGroup()
      title = this.editGroup.id ? this.editGroup.name : 'New Group'
    }
    // TODO correct title for each 3 states
    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        onBack={(this.editOrganizationOpen || this.addGroupOpen) && this.handleBack}
        open={uiStore.organizationMenuOpen}
      >
        { content }
      </Modal>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationMenu
