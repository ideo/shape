import PropTypes from 'prop-types'
import { observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Dialog, {
  DialogContent,
  DialogTitle,
} from 'material-ui/Dialog'
import { withStyles } from 'material-ui/styles'
import OrganizationEdit from '~/ui/layout/OrganizationEdit'

const materialStyles = {
  paper: {
    width: 624,
  }
}

@inject('uiStore')
@observer
class OrganizationMenu extends React.Component {
  @observable editOrganizationOpen = null;

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeOrganizationMenu()
  }

  handleOrganizationClick = () => {
    if (!this.editOrganization) {
      this.editOrganizationOpen = true
    }
  }

  render() {
    const { classes, organization, uiStore } = this.props
    return (
      <Dialog
        open={uiStore.organizationMenuOpen}
        classes={classes}
        onClose={this.handleClose}
        aria-labelledby="form-dialog-title"
        BackdropProps={{ invisible: true }}
      >
        <DialogTitle id="form-dialog-title">People & Groups</DialogTitle>
        <DialogContent>
          <h3>
            Your Organization
          </h3>
          <button onClick={this.handleOrganizationClick}>
            <strong>{ organization.name }</strong>
          </button>
          { !!this.editOrganizationOpen &&
            <OrganizationEdit organization={organization} />
          }
        </DialogContent>
      </Dialog>
    )
  }
}

OrganizationMenu.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  classes: PropTypes.shape({
    paper: PropTypes.string,
  }).isRequired,
}
OrganizationMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// apply the wrapper here so that it doesn't interfere with propType definition
export default withStyles(materialStyles)(OrganizationMenu)
