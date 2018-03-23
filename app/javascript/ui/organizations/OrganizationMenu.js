import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { FormSpacer, TextButton } from '~/ui/global/styled/forms'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import { Heading3, DisplayText } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import RolesMenu from '~/ui/roles/RolesMenu'
import OrganizationEdit from './OrganizationEdit'

@inject('apiStore', 'uiStore')
@observer
class OrganizationMenu extends React.Component {
  @observable editOrganizationOpen = false
  @observable modifyGroupOpen = false
  @observable editGroup = {}
  @observable modifyGroupRoles = false

  componentDidMount() {
    // TODO this gets called on page load because of uiStore isshowing
    const { apiStore, userGroups } = this.props
    const groupReqs = userGroups.map(group =>
      apiStore.request(`groups/${group.id}/roles`, 'GET'))
    Promise.all(groupReqs).then(responses => {
      const roles = responses.map(res => res.data)
      apiStore.add(roles, 'roles')
    })
  }

  @action onGroupSave = () => {
    this.modifyGroupOpen = false
    this.editGroup = false
  }

  @action onModifyGroupRoles(group) {
    this.editingGroup = group
    this.modifyGroupRoles = true
  }

  @action onGroupSave = () => {
    this.modifyGroupOpen = false
    this.editGroup = {}
  }

  @action onOrganizationSave = () => {
    this.editOrganizationOpen = false
  }

  @action changeModifyGroup(group) {
    this.modifyGroupOpen = true
    this.editGroup = group
  }

  @action handleOrganizationClick = () => {
    if (!this.editOrganization) {
      this.editOrganizationOpen = true
    }
  }

  @action handleGroupAddClick = (ev) => {
    this.modifyGroupOpen = true
  }

  @action handleBack = () => {
    this.editOrganizationOpen = false
    this.modifyGroupOpen = false
    this.modifyGroupRoles = false
    this.editGroup = {}
  }

  handleGroupClick = group => () => {
    this.changeModifyGroup(group)
  }

  handleGroupRolesClick = (group) => {
    this.onModifyGroupRoles(group)
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeOrganizationMenu()
  }

  renderEditOrganization() {
    const { organization } = this.props
    return (
      <OrganizationEdit
        onSave={this.onOrganizationSave}
        organization={organization}
      />
    )
  }

  renderEditGroup() {
    return (
      <GroupModify
        group={this.editGroup}
        onGroupRoles={this.handleGroupRolesClick}
        onSave={this.onGroupSave}
      />
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
        <FormSpacer />
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
    // TODO build nested modal functionality out in separate component
    const { apiStore, uiStore } = this.props
    let content = this.renderBase()
    let title = 'People & Groups'
    let onBack
    if (this.editOrganizationOpen) {
      content = this.renderEditOrganization()
      title = 'Your Organization'
      onBack = this.handleBack
    } else if (this.modifyGroupRoles) {
      // There are roles in the apiStore from collection that don't have
      // resource
      const roles = apiStore.findAll('roles').filter((role) =>
        role.resource && role.resource.id === this.editingGroup.id)
      content = (
        <RolesMenu
          ownerId={this.editingGroup.id}
          ownerType="groups"
          title="Members:"
          addCallout="Add people:"
          roles={roles}
        />)
      onBack = this.handleBack
      title = this.editingGroup.name
    } else if (this.modifyGroupOpen) {
      content = this.renderEditGroup()
      title = this.editGroup.id ? this.editGroup.name : 'New Group'
      onBack = this.handleBack
    }
    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        onBack={onBack}
        open={uiStore.organizationMenuOpen}
      >
        { content }
      </Modal>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.arrayOrObservableArray.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationMenu
