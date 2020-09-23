import PropTypes from 'prop-types'
// import { PropTypes as MobxPropTypes } from 'mobx-react'

import { Fragment } from 'react'
// import { Label } from '~/ui/global/styled/forms'
import RolesSummary from '~/ui/roles/RolesSummary'
import { uiStore } from '~/stores'
// import OrganizationMenu from '~/ui/organizations'

// TODO: load groups/BUs and their roles?
// OrganizationMenu gets its roles from /users/me
// Will need to rework that for this
const OrganizationRoles = ({ roles, canEdit }) => {
  // /users/me doesn't get the roles for all groups
  // need to fetch roles for primary_group before rendering

  // TODO: this won't work because it's using an action
  const showObjectRoleDialog = () => {
    uiStore.update('rolesMenuOpen', 'OrganizationRoles')
  }

  return (
    <Fragment>
      <RolesSummary
        // TODO: Modify RolesSummary to handle these props
        editorRoleName={'admin'}
        viewerRoleName={'member'}
        buttonText="" // Button text intentionally blank here
        roles={roles}
        handleClick={() => showObjectRoleDialog()}
        canEdit={canEdit}
        rolesMenuOpen={!!uiStore.rolesMenuOpen} // boolean from uiStore
      />
      {/* TODO: import people and groups modal & open when clicking + button */}
    </Fragment>
  )
}

// just for linting
OrganizationRoles.defaultProps = {
  roles: {},
  canEdit: true,
}
OrganizationRoles.propTypes = {
  roles: PropTypes.object,
  // Failed prop type: OrganizationRoles: prop type `roles` is invalid; it must be a function, usually from the `prop-types` package, but received `object`.
  // roles: MobxPropTypes.arrayOrObservableArray(
  //   MobxPropTypes.objectOrObservableObject
  // ),
  canEdit: PropTypes.bool,
}

export default OrganizationRoles
