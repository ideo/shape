import { action, runInAction, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

@inject('uiStore')
@observer
class OrganizationModal extends React.Component {
  @observable currentPage = 'base'

  @action changePage(page) {
    this.currentPage = page
  }

  renderEditOrganization() {
    const { organization } = this.props
    return (
      <GroupModify
        group={organization.primary_group}
        onGroupRoles={this.handleGroupRolesClick(organization.primary_group)}
        onSave={this.onOrganizationSave}
      />
    )
  }

  renderEditGroup() {
    return (
      <GroupModify
        group={this.editGroup}
        onGroupRoles={this.handleGroupRolesClick(this.editGroup)}
        onSave={this.onGroupSave}
      />
    )
  }

  renderEditRoles() {
    return (
      <RolesMenu
        canEdit={this.editGroup.currentUserCanEdit}
        ownerId={this.editGroup.id}
        ownerType="groups"
        title="Members:"
        addCallout="Add people:"
        roles={this.editGroup.groupRoles}
        onSave={this.onRolesSave}
      />)
  }

  renderBase() {
    const { organization, userGroups } = this.props
    const primaryGroup = organization.primary_group
    return (
      <div>
        {organization.primary_group.currentUserCanEdit &&
          <Row>
            <RowItemRight>
              <TextButton onClick={this.handleGroupAddClick}>
                + New Group
              </TextButton>
            </RowItemRight>
          </Row>
        }
        <Heading3>
          Your Organization
        </Heading3>
        <Row>
          <button className="orgEdit" onClick={this.handleGroupRolesClick(primaryGroup)}>
            <DisplayText>{ primaryGroup.name }</DisplayText>
          </button>
        </Row>
        <FormSpacer />
        <Heading3>
          Your Groups
        </Heading3>
        { userGroups.map((group) =>
          (!group.is_primary &&
          <Row key={group.id}>
            <button
              className="groupEdit"
              onClick={this.handleGroupClick(group)}
            >
              <DisplayText>{group.name}</DisplayText>
            </button>
            { group.currentUserCanEdit &&
              <RemoveIconHolder onClick={this.handleGroupRemove(group)}>
                <ArchiveIcon />
              </RemoveIconHolder>
            }
          </Row>))
        }
      </div>
    )
  }

  render() {
    // TODO build nested modal functionality out in separate component
    const { uiStore } = this.props
    let content = this.renderBase()
    let title = 'People & Groups'
    let onBack, onEdit
    if (this.editOrganizationOpen) {
      content = this.renderEditOrganization()
      title = 'Your Organization'
      onBack = this.handleBack
    } else if (this.modifyGroupRoles) {
      if (this.isLoading) {
        content = <Loader height="350px" fadeIn="none" />
      } else {
        content = this.renderEditRoles()
      }
      onBack = this.handleBack
      if (this.editGroup.currentUserCanEdit) {
        onEdit = () => {
          this.changeModifyGroup(this.editGroup)
        }
      }
      title = this.editGroup.name
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
        onEdit={onEdit}
        open={uiStore.organizationMenuOpen}
      >
        { content }
      </Modal>
    )
  }
}

OrganizationModal.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.arrayOrObservableArray.isRequired,
}
OrganizationModal.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationModal
