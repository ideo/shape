import PropTypes from 'prop-types'
import { action, runInAction, observable, toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import RolesMenu from '~/ui/roles/RolesMenu'
import Loader from '~/ui/layout/Loader'
import Group from '~/stores/jsonApi/Group'
import Organization from '~/stores/jsonApi/Organization'
import OrganizationPeople from '~/ui/organizations/OrganizationPeople'
import GroupTitle from '~/ui/groups/GroupTitle'

@inject('apiStore', 'uiStore')
@observer
class OrganizationMenu extends React.Component {
  @observable editGroup = {}
  @observable isLoading = false

  componentDidMount() {
    const { apiStore, uiStore } = this.props

    if (uiStore.orgCreated) {
      uiStore.update('orgCreated', false)
      uiStore.alertOk('Your organization has been created')
      // send you to add members to the newly created org
      this.goToEditGroupRoles(apiStore.currentUserOrganization.primary_group)
    }
  }

  get currentPage() {
    return this.props.uiStore.organizationMenuPage
  }

  changePage(page) {
    const { uiStore } = this.props
    uiStore.update('organizationMenuPage', page)
    uiStore.update('organizationMenuGroupId', null)
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

  saveOrganization = (primaryGroup) => {
    primaryGroup.save()
    this.changePage('organizationPeople')
  }

  createOrganization = async (organizationData) => {
    const { apiStore, uiStore } = this.props
    const newOrg = new Organization(organizationData, apiStore)
    try {
      this.isLoading = true
      await newOrg.save()
      await apiStore.currentUser.switchOrganization(newOrg.id,
        { backToHomepage: true })
      this.isLoading = false
      uiStore.update('orgCreated', true)
    } catch (err) {
      this.isLoading = false
      uiStore.alert(err.error[0])
    }
  }

  @action createGroup = async (groupData) => {
    const { apiStore, uiStore } = this.props
    const newGroup = new Group(toJS(groupData), apiStore)
    try {
      await newGroup.save()
    } catch (err) {
      uiStore.defaultAlertError()
    }
    // Re-fetch current user that has the new group now
    apiStore.loadCurrentUser()
    this.goToEditGroupRoles(newGroup)
    // because this is after async/await
    runInAction(() => { this.isLoading = true })
    const res = await apiStore.fetchRoles(newGroup)
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

  renderAddGroup() {
    return (
      <GroupModify
        group={{}}
        onSave={this.createGroup}
      />
    )
  }

  renderCreateOrganization() {
    return (
      <GroupModify
        group={{}}
        onSave={this.createOrganization}
        groupType="Organization"
      />
    )
  }

  renderEditOrganization() {
    const { organization } = this.props
    const editGroup = organization.primary_group
    return (
      <GroupModify
        onGroupRoles={this.onGroupRoles(editGroup)}
        group={editGroup}
        onSave={this.saveOrganization}
        groupType="Organization"
      />
    )
  }

  renderEditRoles() {
    return (
      <RolesMenu
        canEdit={this.editGroup.can_edit}
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

  renderGroupTitle() {
    return (
      <GroupTitle
        group={this.editGroup}
        onSave={this.onGroupSave}
        canEdit={this.editGroup.can_edit}
      />
    )
  }

  render() {
    const { open, uiStore, apiStore } = this.props
    let content, title, onBack, onEdit
    switch (this.currentPage) {
    case 'addGroup':
      content = this.renderAddGroup()
      title = 'New Group'
      onBack = this.goBack
      break
    case 'newOrganization':
      title = 'New Organization'
      onBack = this.goBack
      content = this.renderCreateOrganization()
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
        if (uiStore.organizationMenuGroupId) {
          runInAction(() => {
            this.editGroup = apiStore.find('groups', uiStore.organizationMenuGroupId)
          })
        }
        content = this.renderEditRoles()
      }
      if (this.editGroup.can_edit) {
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
