import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { Fragment } from 'react'
// import { Label } from '~/ui/global/styled/forms'
// import RolesSummary from '~/ui/roles/RolesSummary'
import { uiStore } from '~/stores'
import AvatarGroup, { MAX_AVATARS_TO_SHOW } from '../global/AvatarGroup'
import Avatar from '../global/Avatar'
import { AddButton } from '../global/styled/buttons'
import Tooltip from '../global/Tooltip'
// import OrganizationMenu from '~/ui/organizations'
import _ from 'lodash'
import AdminUsersModal from '../admin/AdminUsersModal'
import RolesAdd from '../roles/RolesAdd'
// TODO: load groups/BUs and their roles?
// OrganizationMenu gets its roles from /users/me
// Will need to rework that for this
@inject('apiStore')
@observer
class OrgSettingsUserSummary extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    // replace with fetching specific group members
    // Make this dumber and just have Team/Org Tab pass in the data?
    // this.props.apiStore.fetchShapeAdminUsers()
    // need to fetch roles for primary_group before rendering
    // /users/me doesn't get the roles for all groups
  }

  // TODO: this won't work because it's using an action
  showObjectRoleDialog = () => {
    uiStore.update('rolesMenuOpen', 'OrgSettingsUserSummary')
  }

  usersAndGroupsForRole = roleName => {
    const { roles } = this.props.group
    const role = _.find(roles, {
      name: roleName,
    })
    if (!role) return []
    const sortedUsers = _.sortBy(role.users, 'name')
    const sortedGroups = _.sortBy(role.groups, 'name')

    return [...sortedUsers, ...sortedGroups]
  }

  render() {
    const users = this.usersAndGroupsForRole(this.props.roleName).slice(
      0,
      MAX_AVATARS_TO_SHOW
    )
    const userCount = users.length
    const toolTipText = `Add ${this.props.roleName}`

    return (
      <Fragment>
        <AvatarGroup
          avatarCount={userCount}
          placeholderTitle={`...and more ${this.props.roleName}s`}
        >
          {users.map(user => (
            <Avatar
              className="admin"
              key={`${user.internalType}_${user.id}`}
              title={user.nameWithHints || user.name}
              url={user.pic_url_square || user.filestack_file_url}
              displayName
            />
          ))}
        </AvatarGroup>
        <Tooltip title={toolTipText}>
          <AddButton onClick={this.props.handleClick}> + </AddButton>
        </Tooltip>
        {/* TODO: import people and groups modal & open when clicking + button */}
      </Fragment>
    )
  }
}

OrgSettingsUserSummary.propTypes = {
  handleClick: PropTypes.func.isRequired,
  roleName: PropTypes.string.isRequired,
  group: MobxPropTypes.objectOrObservableObject.isRequired,
}

OrgSettingsUserSummary.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrgSettingsUserSummary
