import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { DialogContent, DialogTitle } from 'material-ui/Dialog'
import {
  FormSpacer,
  Heading2,
  Heading3,
  Modal,
  ModalCloseButton
} from '~/ui/global/styled'
import CloseIcon from '~/ui/icons/CloseIcon'
import Role from '~/stores/jsonApi/Role'
import RolesAdd from '~/ui/layout/RolesAdd'
import RoleSelect from '~/ui/layout/RoleSelect'

function sortUser(a, b) {
  return a.user.name
    ? a.user.name.localeCompare(b.user.name)
    : a.user.email.localeCompare(b.user.email)
}

@inject('apiStore', 'uiStore')
@observer
class RolesMenu extends React.Component {
  onDelete = (role, user) =>
    this.props.apiStore.request(`users/${user.id}/roles/${role.id}`,
      'DELETE')

  onCreateRoles = (users, roleName) => {
    const { apiStore, collectionId } = this.props
    const userIds = users.map((user) => user.id)
    const data = { role: { name: roleName }, user_ids: userIds }
    return apiStore.request(`collections/${collectionId}/roles`, 'POST', data)
      .catch((err) => console.warn(err))
  }

  onCreateUsers = (emails) => {
    const { apiStore } = this.props
    return apiStore.request(`users/create_from_emails`, 'POST', { emails })
  }

  onUserSearch = (searchTerm) => {
    const { apiStore } = this.props
    return apiStore.request(
      `users/search?query=${searchTerm}`
    )
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  render() {
    const { classes, roles, uiStore } = this.props
    const roleUsers = []
    roles.forEach((role) =>
      role.users.forEach((user) => {
        roleUsers.push(Object.assign({}, { role, user }))
      }))
    const sortedRoleUsers = roleUsers.sort(sortUser)
    // TODO abstract shared dialog functionality to component
    return (
      <Modal
        open={!!uiStore.rolesMenuOpen}
        onClose={this.handleClose}
        aria-labelledby="sharing"
        classes={classes}
        BackdropProps={{ invisible: true }}
      >
        <ModalCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </ModalCloseButton>
        <DialogTitle disableTypography id="sharing">
          <Heading2>Sharing</Heading2>
        </DialogTitle>
        <DialogContent>
          <Heading3>Shared with</Heading3>
          { sortedRoleUsers.map(combined =>
            (<RoleSelect
              key={combined.user.id + combined.role.id}
              role={combined.role}
              user={combined.user}
              onDelete={this.onDelete}
              onCreate={this.onCreateRoles}
            />))
          }
          <FormSpacer />
          <Heading3>Add groups or people</Heading3>
          <RolesAdd
            onCreateRoles={this.onCreateRoles}
            onCreateUsers={this.onCreateUsers}
            onSearch={this.onUserSearch}
          />
        </DialogContent>
      </Modal>
    )
  }
}

RolesMenu.propTypes = {
  collectionId: PropTypes.number.isRequired,
  classes: PropTypes.shape({
    paper: PropTypes.string,
  }).isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
}
RolesMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesMenu.defaultProps = {
  roles: [],
}

export default withStyles(materialStyles)(RolesMenu)
