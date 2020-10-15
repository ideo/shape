import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { action, runInAction, observable, toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import Modal from '~/ui/global/modals/Modal'
import GroupModify from '~/ui/groups/GroupModify'
import GroupModifyDialogActions from '~/ui/groups/GroupModifyDialogActions'
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
  groupFormDisabled = true
  defaultGroupFormFields = {
    name: '',
    handle: '',
    filestack_file_url: '',
    filestack_file_attributes: null,
  }
  @observable
  groupFormFields = { ...this.defaultGroupFormFields }

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

  @action
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
  changeGroupFormName(name) {
    this.groupFormFields.name = name
  }

  @action
  changeGroupFormHandle(handle) {
    // limit to 30
    this.groupFormFields.handle = handle.slice(0, 30)
    const first = _.first(_.slice(handle, 0, 1))
    // disable form if the handle starts with a number
    if (!first || parseInt(first).toString() === first) {
      this.groupFormDisabled = true
    } else {
      this.groupFormDisabled = false
    }
  }

  @action
  changeGroupFormFileAttrs(fileAttrs) {
    this.groupFormFields.filestack_file_url = fileAttrs.url
    this.groupFormFields.filestack_file_attributes = fileAttrs
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
    this.groupFormFields = { ...this.defaultGroupFormFields }
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
        formDisabled={this.groupFormDisabled}
        groupFormFields={this.groupFormFields}
        changeGroupFormName={name => {
          this.changeGroupFormName(name)
        }}
        changeGroupFormHandle={handle => {
          this.changeGroupFormHandle(handle)
        }}
        changeGroupFormFileAttrs={fileAttrs => {
          this.changeGroupFormFileAttrs(fileAttrs)
        }}
      />
    )
  }

  renderCreateOrganization() {
    return (
      <Fragment>
        {this.isLoading && <InlineLoader />}
        <GroupModify
          group={{}}
          onCancel={this.handleLogout}
          groupType="Organization"
          creatingOrg
          formDisabled={this.groupFormDisabled}
          groupFormFields={this.groupFormFields}
          changeGroupFormName={name => {
            this.changeGroupFormName(name)
          }}
          changeGroupFormHandle={handle => {
            this.changeGroupFormHandle(handle)
          }}
          changeGroupFormFileAttrs={fileAttrs => {
            this.changeGroupFormFileAttrs(fileAttrs)
          }}
        />
      </Fragment>
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
        groupFormFields={this.groupFormFields}
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
    const { uiStore } = this.props

    return (
      <RolesMenu
        record={this.editGroup}
        canEdit={this.editGroup.can_edit}
        ownerId={this.editGroup.id}
        ownerType="groups"
        title="Members:"
        addedNewRole={uiStore.addedNewRole}
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

  renderGroupModifyDialogActions(dialogType) {
    if (this.isLoading) return null

    if (dialogType === 'group') {
      return (
        <GroupModifyDialogActions
          isLoading={this.isLoading}
          onSave={() => {
            this.createGroup(this.groupFormFields)
          }}
          formDisabled={this.groupFormDisabled}
        />
      )
    } else if (dialogType === 'organization') {
      return (
        <GroupModifyDialogActions
          isLoading={this.isLoading}
          onSave={() => {
            this.createOrganization(this.groupFormFields)
          }}
          onCancel={this.handleLogout}
          groupType="Organization"
          creatingOrg
          formDisabled={this.groupFormDisabled}
          groupFormFields={this.groupFormFields}
        />
      )
    }

    return null
  }

  renderRolesModifyDialogActions() {
    if (this.isLoading) return null

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
        dialogActions = this.renderGroupModifyDialogActions('group')
        noScroll = true
        break
      case 'newOrganization':
        title = 'New Organization'
        onBack = locked ? null : this.goBack
        content = this.renderCreateOrganization()
        dialogActions = this.renderGroupModifyDialogActions('organization')
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
