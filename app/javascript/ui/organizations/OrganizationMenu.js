import PropTypes from 'prop-types'
import { action, runInAction, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import RolesMenu from '~/ui/roles/RolesMenu'
import Loader from '~/ui/layout/Loader'
import OrganizationPeople from '~/ui/organizations/OrganizationPeople'
import GroupTitle from '~/ui/groups/GroupTitle'

@inject('apiStore', 'uiStore')
@observer
class OrganizationMenu extends React.Component {
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

  fetchRoles = (group) => {
    const { apiStore } = this.props
    return apiStore.request(`groups/${group.id}/roles`, 'GET')
  }

  get currentPage() {
    return this.props.uiStore.organizationMenuPage
  }

  changePage(page) {
    this.props.uiStore.update('organizationMenuPage', page)
  }

  @action goToEditGroupRoles(group) {
    this.changePage('editRoles')
    this.editGroup = group
  }

  goToAddGroup = (ev) => {
    this.changePage('addGroup')
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

  @action onNewGroupSave = async (newGroup) => {
    const { apiStore } = this.props
    this.editGroup = {}
    this.goToEditGroupRoles(newGroup)
    this.isLoading = true
    const res = await this.fetchRoles(newGroup)
    // because this is after async/await
    runInAction(() => { this.isLoading = false })
    apiStore.sync(res)
  }

  onGroupRoles = group => () => {
    this.goToEditGroupRoles(group)
  }

  onRolesSave = (res) => {
    const { apiStore } = this.props
    apiStore.sync(res)
  }

  @action handleClose = (ev) => {
    this.props.onClose()
    this.isLoading = false
    this.editGroup = {}
  }

  removeGroup = group => async () => {
    group.API_archive()
  }

  renderEditGroup() {
    return (
      <GroupModify
        group={this.editGroup}
        onGroupRoles={this.onGroupRoles(this.editGroup)}
        onSave={this.onNewGroupSave}
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

  renderGroupTitle() {
    return (
      <GroupTitle
        group={this.editGroup}
        canEdit={this.editGroup.currentUserCanEdit}
      />
    )
  }

  render() {
    const { open } = this.props
    let content, title, onBack, onEdit
    switch (this.currentPage) {
    case 'addGroup':
      content = this.renderEditGroup()
      title = 'New Group'
      onBack = this.goBack
      break
    case 'editOrganization':
      title = 'Your Organization'
      onBack = this.goBack
      content = this.renderEditOrganization()
      break
    case 'editGroup':
      content = this.renderEditGroup()
      title = this.editGroup.id ? this.renderGroupTitle() : 'New Group'
      onBack = this.goBack
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
      title = this.renderGroupTitle()
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
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.defaultProps = {
  open: false
}

export default OrganizationMenu
