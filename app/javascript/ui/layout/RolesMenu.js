import PropTypes from 'prop-types'
import styled from 'styled-components'
import { extendObservable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Dialog, {
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'

const Row = styled.div`
  display: flex
`
Row.displayName = 'Row'

@inject('uiStore')
@observer
class RolesMenu extends React.Component {
  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  renderUser(user, role) {
    return (
      <Row>
        <span>
          {user.name}<br />
          {user.email}
        </span>
        <span>
          <select value={role}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </span>
      </Row>
    )
  }

  render() {
    const { uiStore, editors, viewers } = this.props
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
            <p>Shared with</p>
            { editors.map((user) =>
              this.renderUser(user, 'editor'))
            }
            { viewers.map((user) =>
              this.renderUser(user, 'viewers'))
            }
          </DialogContentText>
        </DialogContent>
      </Dialog>
    )
  }
}

RolesMenu.propTypes = {
  editors: MobxPropTypes.arrayOrObservableArray.isRequired,
  viewers: MobxPropTypes.arrayOrObservableArray.isRequired,
  collectionId: PropTypes.number
}
RolesMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default RolesMenu
