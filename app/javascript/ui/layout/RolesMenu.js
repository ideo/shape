import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Dialog, {
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'

@inject('uiStore')
@observer
class RolesMenu extends React.Component {
  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  render() {
    const { uiStore } = this.props
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
          <DialogContentText>
            Organization
          </DialogContentText>
        </DialogContent>
      </Dialog>
    )
  }
}

RolesMenu.propTypes = {
}
RolesMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RolesMenu
