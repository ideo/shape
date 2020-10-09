import PropTypes from 'prop-types'
import { action, runInAction, observable, toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/modals/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import GroupsModifyDialogActions from '~/ui/groups/GroupsModifyDialogActions'
import RolesMenu from '~/ui/roles/RolesMenu'
import RolesMenuDialogActions from '~/ui/roles/RolesMenuDialogActions'
import InlineLoader from '~/ui/layout/InlineLoader'
import Loader from '~/ui/layout/Loader'
import OrganizationPeople from '~/ui/organizations/OrganizationPeople'
import GroupTitle from '~/ui/groups/GroupTitle'
import Group from '~/stores/jsonApi/Group'
import Organization from '~/stores/jsonApi/Organization'
import googleTagManager from '~/vendor/googleTagManager'
import { useTemplateInMyCollection } from '~/utils/url'

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class OrganizationMenu extends React.Component {
  @observable
  editGroup = {}
  @observable
  isLoading = false
  @observable
  groupFormDisabled = false

  get currentPage() {
    return this.props.uiStore.organizationMenuPage
  }

  changePage(page) {
    const { uiStore } = this.props
    uiStore.update('organizationMenuPage', page)
    uiStore.update('organizationMenuGroupId', null)
  }

  @action
  goToEditGroupRoles(group) {
    this.changePage('editRoles')
    this.editGroup = group
  }

  goToAddGroup = ev => {
    this.changePage('addGroup')
  }

  @action
  goToEditGroup(group) {
    this.changePage('editGroup')
    this.editGroup = group
  }

  @action
  goBack = () => {
    this.changePage('organizationPeople')
    this.isLoading = false
    this.editGroup = {}
  }

  @action
  disableGroupForm = disabled => {
    this.groupFormDisabled = disabled
  }

  saveOrganization = primaryGroup => {
    primaryGroup.save()
    this.changePage('organizationPeople')
  }

  afterGroupSave = group => {
    if (!group.is_primary) return
    const { apiStore, organization } = this.props
    apiStore.fetch('groups', organization.guest_group.id)
    apiStore.fetch('groups', organization.admin_group.id)
  }

  createOrganization = async organizationData => {
    const { apiStore, uiStore, routingStore, onClose } = this.props
    const newOrg = new Organization(organizationData, apiStore)
    try {
      runInAction(() => {
        this.isLoading = true
      })
      const hasOrg = !!apiStore.currentUserOrganization
      const res = await newOrg.create()
      googleTagManager.push({
        event: 'formSubmission',
        formType: hasOrg ? 'Additional Org' : 'New Org',
        organization: newOrg.slug,
      })
      if (res.meta && res.meta.use_template_id) {
        return useTemplateInMyCollection(res.meta.use_template_id)
      }
      routingStore.routeTo(`/${newOrg.slug}`)
      onClose()
    } catch (err) {
      uiStore.alert(err.error ? err.error[0] : 'There was an error.')
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  @action
  createGroup = async groupData => {
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
    runInAction(() => {
      this.isLoading = true
    })
    await apiStore.fetchRoles(newGroup)
    runInAction(() => {
      this.isLoading = false
    })
  }

  onGroupRoles = group => () => {
    this.goToEditGroupRoles(group)
  }

  @action
  handleClose = ev => {
    this.props.onClose()
    this.isLoading = false
    this.editGroup = {}
  }

  handleLogout = ev => {
    ev.preventDefault()
    const { apiStore } = this.props
    apiStore.currentUser.logout()
  }

  removeGroup = group => async () => {
    group.API_archive()
  }

  renderAddGroup() {
    return (
      <GroupModify
        group={{}}
        isLoading={this.isLoading}
        onSave={this.createGroup}
        formDisabled={this.groupFormDisabled}
        handleDisableForm={this.disableGroupForm}
      />
    )
  }

  renderCreateOrganization() {
    if (this.isLoading) return <InlineLoader />
    return (
      <GroupModify
        group={{}}
        isLoading={this.isLoading}
        onSave={this.createOrganization}
        onCancel={this.handleLogout}
        groupType="Organization"
        creatingOrg
        formDisabled={this.groupFormDisabled}
        handleDisableForm={this.disableGroupForm}
      />
    )
  }

  renderEditOrganization() {
    /*FIXME this may not be used*/
    const { organization } = this.props
    const editGroup = organization.primary_group
    return (
      <GroupModify
        onGroupRoles={this.onGroupRoles(editGroup)}
        group={editGroup}
        isLoading={this.isLoading}
        onSave={group => {
          this.saveOrganization(group)
          this.afterGroupSave(group)
        }}
        onCancel={this.handleClose}
        groupType="Organization"
      />
    )
  }

  renderEditRoles() {
    return (
      <RolesMenu
        record={this.editGroup}
        canEdit={this.editGroup.can_edit}
        ownerId={this.editGroup.id}
        ownerType="groups"
        title="Members:"
      />
    )
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
    const canEditTitle =
      this.editGroup.can_edit && !this.editGroup.isGuestOrAdmin
    return (
      <GroupTitle
        group={this.editGroup}
        onSave={this.afterGroupSave}
        canEdit={canEditTitle}
      />
    )
  }

  renderGroupsModifyDialogActions(dialogType) {
    if (dialogType === 'group') {
      return (
        <GroupsModifyDialogActions
          isLoading={this.isLoading}
          onSave={this.createGroup}
          formDisabled={this.groupFormDisabled}
        />
      )
    } else if (dialogType === 'organization') {
      return (
        <GroupsModifyDialogActions
          isLoading={this.isLoading}
          onSave={this.createOrganization}
          onCancel={this.handleLogout}
          groupType="Organization"
          creatingOrg
          formDisabled={this.groupFormDisabled}
        />
      )
    }

    return null
  }

  renderRolesModifyDialogActions() {
    let fixedRole = null
    if (this.editGroup.is_guest) {
      fixedRole = 'member'
    } else if (this.editGroup.is_admin) {
      fixedRole = 'admin'
    }

    if (!this.editGroup.id) {
      return null
    }

    return (
      <RolesMenuDialogActions
        record={this.editGroup}
        setDidAddNewRole={this.setDidAddNewRole}
        fixedRole={fixedRole}
      />
    )
  }

  render() {
    const { open, uiStore, apiStore, locked } = this.props
    let content, title, onBack, onEdit, dialogActions
    let noScroll = false
    switch (this.currentPage) {
      case 'addGroup':
        content = this.renderAddGroup()
        title = 'New Group'
        onBack = this.goBack
        dialogActions = this.renderGroupsModifyDialogActions('group')
        noScroll = true
        break
      case 'newOrganization':
        title = 'New Organization'
        onBack = locked ? null : this.goBack
        content = this.renderCreateOrganization()
        dialogActions = this.renderGroupsModifyDialogActions('organization')
        noScroll = true
        break
      case 'editOrganization':
        // FIXME: this is no longer reachable
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
              this.editGroup = apiStore.find(
                'groups',
                uiStore.organizationMenuGroupId
              )
            })
          }
          content = this.renderEditRoles()
          dialogActions = this.renderRolesModifyDialogActions()
          noScroll = true
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
        noScroll = true
        break
    }

    return (
      <Modal
        title={title}
        onClose={locked ? null : this.handleClose}
        onBack={onBack}
        onEdit={onEdit}
        open={open}
        noScroll={noScroll}
        dialogActions={dialogActions}
      >
        {content}
      </Modal>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.arrayOrObservableArray.isRequired,
  open: PropTypes.bool,
  // `locked` is for when you're required to setup your initial org
  locked: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.defaultProps = {
  open: false,
  locked: false,
}
OrganizationMenu.displayName = 'OrganizationMenu'

export default OrganizationMenu
