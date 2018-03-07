import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Dialog, {
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'

@inject('uiStore')
@observer
class OrganizationMenu extends React.Component {
  handleClose = (ev) => {
    const { uiStore, organization } = this.props
    uiStore.closeOrganizationMenu(organization)
  }

  render() {
    const { uiStore } = this.props
    return (
      <Dialog
        open={!!uiStore.organizationMenuOpen}
        onClose={this.handleClose}
        aria-labelledby="form-dialog-title"
        BackdropProps={{ invisible: true }}
      >
        <DialogTitle id="form-dialog-title">People & Groups</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Organization
          </DialogContentText>
        </DialogContent>
      </Dialog>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// apply the wrapper here so that it doesn't interfere with propType definition
export default OrganizationMenu
