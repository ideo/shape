import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'

@inject('uiStore')
@observer
class Roles extends React.Component {
  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  render() {
    const { roles, uiStore, ownerId } = this.props

    return (
      <Modal
        title="Sharing"
        onClose={this.handleClose}
        open={uiStore.rolesMenuOpen}
      >
        <RolesMenu
          ownerId={ownerId}
          ownerType="collections"
          title="Sharing"
          roles={roles}
        />
      </Modal>
    )
  }
}

Roles.propTypes = {
  ownerId: PropTypes.number.isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
}
Roles.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
Roles.defaultProps = {
  roles: [],
}

export default Roles
