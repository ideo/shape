import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { withStyles } from 'material-ui/styles'
import Dialog, {
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'
import v from '~/utils/variables'
import CloseIcon from '~/ui/icons/CloseIcon'
import Role from '~/stores/jsonApi/Role'
import RoleSelect from '~/ui/layout/RoleSelect'

const materialStyles = {
  paper: {
    borderLeft: `17px solid ${v.colors.blackLava}`,
    minWidth: 824,
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

@inject('apiStore', 'uiStore')
@observer
class RolesMenu extends React.Component {
  componentDidMount() {
    const { apiStore, collectionId } = this.props
    Role.endpoint = () => `collections/${collectionId}/roles`
    apiStore.fetchAll('roles', true)
  }

  onDelete = (role, user) => {
    const { apiStore } = this.props
    return this.props.apiStore.request(`users/${user.id}/roles/${role.id}`,
      'DELETE')
  }

  onCreate = (roleData) => {
    const { apiStore, collectionId } = this.props
    const newRole = new Role(roleData, apiStore)
    newRole.resourceId = collectionId
    newRole.API_create()
      .then((res) => {
        // Re-sync all the roles once modifications successfully happened
        apiStore.remove('roles', roleData.id)
        apiStore.add(res.data)
      })
      .catch((err) => console.warn(err))
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  render() {
    const { classes, roles, uiStore } = this.props
    // TODO how to get the right roles?
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
                onCreate={this.onCreate}
              />)))
          }
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
