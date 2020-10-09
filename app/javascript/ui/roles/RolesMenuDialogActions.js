import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import RolesAdd from '~/ui/roles/RolesAdd'

@inject('uiStore', 'apiStore')
@observer
class RolesMenuDialogActions extends React.Component {
  createUsers = async emails => {
    const { apiStore, uiStore } = this.props
    return await apiStore
      .request(`users/create_from_emails`, 'POST', { emails })
      .catch(err => {
        uiStore.alert(err.error[0])
      })
  }

  createShapeAdminRoles = (users, _, opts = {}) => {
    this.props.apiStore.addShapeAdminUsers(users, opts)
  }

  render() {
    const { context } = this.props

    if (context === 'admin') {
      return (
        <RolesAdd
          title={'Add People:'}
          roleTypes={['shapeAdmin']}
          onCreateRoles={this.createShapeAdminRoles}
          onCreateUsers={this.createUsers}
          ownerType={'shapeAdmins'}
        />
      )
    }

    const { record, fixedRole, uiStore } = this.props

    const roleTypes = type => {
      if (type === 'groups') return ['member', 'admin']
      return ['editor', 'viewer']
    }

    const ownerType = record.internalType

    // ability to restrict the selection to only one role type
    // e.g. "admin" is the only selection for Org Admins group
    const addRoleTypes = fixedRole ? [fixedRole] : roleTypes(ownerType)

    // const editableGroups = groups.filter(group => group.can_edit)
    const editableGroups = record.roles.map(role => {
      return role.groups.filter(group => {
        return group.can_edit
      })
    })

    return (
      <RolesAdd
        record={record}
        roleTypes={addRoleTypes}
        onCreateUsers={this.createUsers}
        onCreateRoles={uiStore.createRoles}
        ownerType={ownerType}
        addableGroups={_.flatten(editableGroups)}
      />
    )
  }
}

RolesMenuDialogActions.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

RolesMenuDialogActions.propTypes = {
  record: MobxPropTypes.objectOrObservableObject,
  fixedRole: PropTypes.string,
  context: PropTypes.string,
}

RolesMenuDialogActions.defaultProps = {
  record: null,
  fixedRole: null,
  context: '',
}

RolesMenuDialogActions.displayName = 'RolesMenuDialogActions'

export default RolesMenuDialogActions
