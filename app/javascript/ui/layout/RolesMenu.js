import PropTypes from 'prop-types'
import styled from 'styled-components'
import { toJS } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { withStyles } from 'material-ui/styles'
import Dialog, {
  DialogContent,
  DialogTitle,
} from 'material-ui/Dialog'
import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'
import Role from '~/stores/jsonApi/Role'
import RolesAdd from '~/ui/layout/RolesAdd'
import RoleSelect from '~/ui/layout/RoleSelect'

const materialStyles = {
  paper: {
    borderLeft: `17px solid ${v.colors.blackLava}`,
    minWidth: 856,
  }
}

const StyledH2 = styled.h2`
  font-family: Gotham;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 2.3px;
  color: ${v.colors.blackLava};
`
StyledH2.displayName = 'StyledH2'

const StyledH3 = styled.h3`
  text-fransform: uppercase;
  margin-bottom: 13px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
`
StyledH3.displayName = 'StyledH3'

const StyledCloseButton = styled.button`
  cursor: pointer;
  display: block;
  right: 28px;
  position: absolute;
  top: 24px;
  width: 14px;
`
StyledCloseButton.displayName = 'StyledCloseButton'

const Spacer = styled.div`
  margin-bottom: 55px;
`
Spacer.displayName = 'StyledSpacer'

@inject('apiStore', 'uiStore')
@observer
class RolesMenu extends React.Component {
  componentDidMount() {
    const { apiStore, collectionId } = this.props
    // TODO might want to refactor PageWithApi so this can be called earlier there
    // TODO investigate how this can be set all the time on Role
    Role.endpoint = () => `collections/${collectionId}/roles`
    apiStore.fetchAll('roles', true)
  }

  onDelete = (role, user) =>
    this.props.apiStore.request(`users/${user.id}/roles/${role.id}`,
      'DELETE')

  onCreateRoles = (users, roleName) => {
    const { apiStore, collectionId, roles } = this.props
    const userIds = users.map((user) => user.id)
    const data = { role: { name: roleName }, user_ids: userIds }
    return apiStore.request(`collections/${collectionId}/roles`, 'POST', data)
      .then(() => {
        const roleToDelete = roles.find((role) => !!role.toDelete)
        if (roleToDelete) {
          apiStore.remove('roles', roleToDelete.id)
        }
      })
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
    // TODO abstract shared dialog functionality to component
    return (
      <Dialog
        open={!!uiStore.rolesMenuOpen}
        onClose={this.handleClose}
        aria-labelledby="sharing"
        classes={classes}
        BackdropProps={{ invisible: true }}
      >
        <StyledCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </StyledCloseButton>
        <DialogTitle disableTypography id="sharing">
          <StyledH2>Sharing</StyledH2>
        </DialogTitle>
        <DialogContent>
          <StyledH3>Shared with</StyledH3>
          { roles.map((role) =>
            role.users.map((user) =>
              (<RoleSelect
                key={user.id + role.id}
                role={role}
                user={user}
                onDelete={this.onDelete}
                onCreate={this.onCreateRoles}
              />)))
          }
          <Spacer />
          <StyledH3>Add groups or people</StyledH3>
          <RolesAdd
            onCreateRoles={this.onCreateRoles}
            onCreateUsers={this.onCreateUsers}
            onSearch={this.onUserSearch}
          />
        </DialogContent>
      </Dialog>
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
