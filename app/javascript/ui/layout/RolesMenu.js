import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Dialog, {
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'
import Role from '~/stores/jsonApi/Role'
import RoleSelect from '~/ui/layout/RoleSelect'

@inject('apiStore', 'uiStore')
@observer
class RolesMenu extends React.Component {
  componentDidMount() {
    const { apiStore, collectionId } = this.props
    apiStore.fetch(`/collections/${collectionId}/roles`)
  }

  onDelete = (role, user) => {
    return this.props.apiStore.request(`users/${user.id}/roles/${role.id}`,
      'DELETE')
  }

  onCreate = (roleData) => {
    const { apiStore, collectionId } = this.props
    const newRole = new Role(roleData, apiStore)
    newRole.resourceId = collectionId
    newRole.API_create()
      .then((res) => console.log('create res', res))
      .catch((err) => console.warn(err))
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  render() {
    const { apiStore, uiStore } = this.props
    // TODO how to get the right roles?
    const roles = apiStore.findAll('roles')
    if (!apiStore.roles.length) return <div></div>
    // TODO abstract shared dialog functionality to component
    return (
      <Dialog
        open={!!uiStore.rolesMenuOpen}
        onClose={this.handleClose}
        aria-labelledby="sharing"
        BackdropProps={{ invisible: true }}
      >
        <DialogTitle id="form-dialog-title">Sharing</DialogTitle>
        <DialogContent>
          <h4>Shared with</h4>
          { roles.map((role) =>
            role.users.map((user) =>
              (<RoleSelect
                key={user.id + role.id}
                role={role}
                user={user}
                onDelete={this.onDelete}
                onCreate={this.onCreate}
              />)))
          }
        </DialogContent>
      </Dialog>
    )
  }
}

RolesMenu.propTypes = {
  collectionId: PropTypes.number.isRequired
}
RolesMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RolesMenu
