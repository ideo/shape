import { action, runInAction, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import RolesMenu from '~/ui/roles/RolesMenu'
import Loader from '~/ui/layout/Loader'
import OrganizationPeople from '~/ui/organizations/OrganizationPeople'

@inject('apiStore', 'uiStore')
@observer
class OrganizationMenu extends React.Component {
  @observable currentPage = 'base'
  @observable editGroup = {}
  @observable isLoading = false

  constructor(props) {
    super(props)
    this.currentPage = props.initialPage
  }

  componentDidMount() {
    const { apiStore, userGroups } = this.props
    const groupReqs = userGroups.map(group => this.fetchRoles(group))
    Promise.all(groupReqs)
      .then(responses => {
        const roles = responses.map(res => res.data)
        apiStore.add(roles, 'roles')
      })
      .catch((err) => console.warn(err))
  }

  @action changePage(page) {
    this.currentPage = page
  }

  @action onModifyGroupRoles(group) {
    this.changePage('modifyGroupRoles')
    this.editGroup = group
  }

  @action onOrganizationSave = () => {
    this.changePage('base')
  }

  @action changeModifyGroup(group) {
    this.changePage('modifyGroup')
    this.editGroup = group
  }

  @action addGroup = (ev) => {
    this.changePage('modifyGroup')
  }

  @action handleBack = () => {
    this.changePage('base')
    this.isLoading = false
    this.editGroup = {}
  }

  @action onGroupSave = async (editedGroup) => {
    const { apiStore } = this.props
    const newGroup = !this.editGroup.id
    this.changePage('base')
    this.editGroup = {}
    if (newGroup) {
      this.onModifyGroupRoles(editedGroup)
      this.isLoading = true
      const res = await this.fetchRoles(editedGroup)
      // because this is after async/await
      runInAction(() => { this.isLoading = false })
      apiStore.sync(res)
    }
  }

  removeGroup = group => async () => {
    const { uiStore } = this.props
    uiStore.confirm({
      prompt: `Are you sure you want to archive ${group.name}?`,
      confirmText: 'Archive',
      iconName: 'Archive',
      onConfirm: () => this.removeGroup(group),
    })
  }

  @action groupRoles = (ev) => {
    this.onModifyGroupRoles(group)

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.update('organizationMenuOpen', false)
    // delay so that you don't see it switch as the modal fades out
    setTimeout(() => {
      // reset the state
      this.handleBack()
    }, 500)
  }

  fetchRoles = (group) => {
    const { apiStore } = this.props
    return apiStore.request(`groups/${group.id}/roles`, 'GET')
  }

  onRolesSave = (res) => {
    const { apiStore } = this.props
    apiStore.sync(res)
  }

  removeGroup = async (group) => {
    try {
      const { apiStore } = this.props
      await group.API_archive()
      const roles = apiStore.findAll('roles').filter((role) =>
        role.resource && role.resource.id === group.id)
      if (roles.find(role => role.users.find(user => user.id ===
          apiStore.currentUserId))) {
        window.location.reload()
      }
      apiStore.fetch('users', apiStore.currentUserId, true)
    } catch (err) {
      console.warn('Unable to archive group', err)
    }
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
    return (
      <OrganizationPeople
        organization={organization}
        userGroups={userGroups}
        onGroupAdd={this.addGroup}
        onGroupRemove={this.removeGroup}
        onGroupRoles={this.groupRoles}
      />
    )
  }

  render() {
    // TODO build nested modal functionality out in separate component
    let content = this.renderBase()
    let title = 'People & Groups'
    let onBack, onEdit
    switch (this.currentPage) {
    case 'modifyGroup':
      content = this.renderEditGroup()
      title = this.editGroup.id ? this.editGroup.name : 'New Group'
      onBack = this.handleBack
      break
    case 'editOrganization':
      title = 'Your Organization'
      onBack = this.handleBack
      content = this.renderEditOrganization()
      break
    case 'modifyGroupRoles':
      onBack = this.handleBack
      if (this.isLoading) {
        content = <Loader height="350px" fadeIn="none" />
      } else {
        content = this.renderEditRoles()
      }
      if (this.editGroup.currentUserCanEdit) {
        onEdit = () => {
          this.changeModifyGroup(this.editGroup)
        }
      }
      title = this.editGroup.name
      break
    case 'base':
    default:
      content = this.renderBase()
      break
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

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.arrayOrObservableArray.isRequired,
  initialPage: PropTypes.oneOf(['base', '']),
}
OrganizationMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.defaultProps = {
  initialPage: 'base',
}

export default OrganizationMenu
