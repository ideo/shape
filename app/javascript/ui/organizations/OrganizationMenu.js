import PropTypes from 'prop-types'
import { action, runInAction, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import RolesMenu from '~/ui/roles/RolesMenu'
import Loader from '~/ui/layout/Loader'
import OrganizationPeople from '~/ui/organizations/OrganizationPeople'

const PAGES = [
  'organizationPeople',
  'editOrganization',
  'editGroup',
  'editRoles',
]

@inject('apiStore', 'uiStore')
@observer
class OrganizationMenu extends React.Component {
  @observable currentPage = OrganizationMenu.defaultProps.initialPage
  @observable editGroup = {}
  @observable isLoading = false

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

  componentWillReceiveProps(nextProps) {
    this.changePage(nextProps.initialPage)
  }

  fetchRoles = (group) => {
    const { apiStore } = this.props
    return apiStore.request(`groups/${group.id}/roles`, 'GET')
  }

  @action changePage(page) {
    this.currentPage = page
  }

  @action goToEditGroupRoles(group) {
    this.changePage('editRoles')
    this.editGroup = group
  }

  goToAddGroup = (ev) => {
    this.changePage('editGroup')
  }

  @action goToEditGroup(group) {
    this.changePage('editGroup')
    this.editGroup = group
  }

  @action goBack = () => {
    this.changePage('organizationPeople')
    this.isLoading = false
    this.editGroup = {}
  }

  onOrganizationSave = () => {
    this.changePage('organizationPeople')
  }

  @action onGroupSave = async (editedGroup) => {
    const { apiStore } = this.props
    const newGroup = !this.editGroup.id
    this.changePage('organizationPeople')
    this.editGroup = {}
    if (newGroup) {
      this.goToEditGroupRoles(editedGroup)
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

  onGroupRoles = group => () => {
    this.goToEditGroupRoles(group)
  }

  onRolesSave = (res) => {
    const { apiStore } = this.props
    apiStore.sync(res)
  }

  handleClose = (ev) => {
    this.props.onClose()
    // delay so that you don't see it switch as the modal fades out
    setTimeout(() => {
      // reset the state
      this.goBack()
    }, 500)
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
        onGroupRoles={this.onGroupRoles(organization.primary_group)}
        onSave={this.onOrganizationSave}
      />
    )
  }

  renderEditGroup() {
    return (
      <GroupModify
        group={this.editGroup}
        onGroupRoles={this.onGroupRoles(this.editGroup)}
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

  renderOrganizationPeople() {
    const { organization } = this.props
    return (
      <OrganizationPeople
        organization={organization}
        userGroups={this.props.userGroups}
        onGroupAdd={this.goToAddGroup}
        onGroupRemove={this.removeGroup}
        onGroupRoles={this.onGroupRoles}
      />
    )
  }

  render() {
    const { open } = this.props
    let content, title, onBack, onEdit
    switch (this.currentPage) {
    case 'editGroup':
      content = this.renderEditGroup()
      title = this.editGroup.id ? this.editGroup.name : 'New Group'
      onBack = this.goBack
      break
    case 'editOrganization':
      title = 'Your Organization'
      onBack = this.goBack
      content = this.renderEditOrganization()
      break
    case 'editRoles':
      onBack = this.goBack
      if (this.isLoading) {
        content = <Loader height="350px" fadeIn="none" />
      } else {
        content = this.renderEditRoles()
      }
      if (this.editGroup.currentUserCanEdit) {
        onEdit = () => {
          this.goToEditGroup(this.editGroup)
        }
      }
      title = this.editGroup.name
      break
    case 'organizationPeople':
    default:
      content = this.renderOrganizationPeople()
      title = 'People & Groups'
      break
    }

    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        onBack={onBack}
        onEdit={onEdit}
        open={open}
      >
        { content }
      </Modal>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.arrayOrObservableArray.isRequired,
  initialPage: PropTypes.oneOf(PAGES),
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.defaultProps = {
  initialPage: 'organizationPeople',
  open: false
}

export default OrganizationMenu
