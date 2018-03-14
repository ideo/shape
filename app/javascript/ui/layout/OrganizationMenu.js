import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import Dialog, {
  DialogContent,
  DialogTitle,
} from 'material-ui/Dialog'
import { withStyles } from 'material-ui/styles'
import CloseIcon from '~/ui/icons/CloseIcon'
import OrganizationAvatar from '~/ui/layout/OrganizationAvatar'
import OrganizationEdit from '~/ui/layout/OrganizationEdit'

const materialStyles = {
  paper: {
    borderLeft: `17px solid ${v.colors.blackLava}`,
    minWidth: 824,
  }
}

const Row = styled.div`
  display: flex;
  margin-left: 5px;
`
Row.displayName = 'Row'

const StyledH2 = styled.h2`
  text-transform: uppercase;
  margin-bottom: 28px;
  font-family: Gotham;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 2.3px;
  color: ${v.colors.blackLava};
`

const StyledH3 = styled.h3`
  text-transform: uppercase;
  margin-bottom: 13px;
  font-family: Gotham;
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
  letter-spacing: 1px;
`
StyledH3.displayName = 'StyledH3'

const StyledText = styled.span`
  font-weight: 300;
  font-family: Gotham;
  font-size: 16px;
`
StyledText.displayName = 'StyledText'

const StyledCloseButton = styled.button`
  cursor: pointer;
  display: block;
  right: 15px;
  position: absolute;
  top: 14px;
  width: 14px;
`

@inject('uiStore')
@observer
class OrganizationMenu extends React.Component {
  @observable editOrganizationOpen = null;

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeOrganizationMenu()
  }

  @action
  handleOrganizationClick = () => {
    if (!this.editOrganization) {
      this.editOrganizationOpen = true
    }
  }

  @action
  onSave = () => {
    this.editOrganizationOpen = false
  }

  renderEditOrganization() {
    const { organization } = this.props
    return (
      <div>
        <DialogTitle disableTypography id="form-dialog-title">
          <StyledH2>Your Organization</StyledH2>
        </DialogTitle>
        <DialogContent>
          <OrganizationEdit
            onSave={this.onSave}
            organization={organization}
          />
        </DialogContent>
      </div>
    )
  }

  render() {
    const { classes, organization, uiStore } = this.props
    let content = (
      <div>
        <DialogTitle disableTypography id="form-dialog-title">
          <StyledH2>People & Groups</StyledH2>
        </DialogTitle>
        <DialogContent>
          <StyledH3>
            Your Organization
          </StyledH3>
          <Row>
            <button className="orgEdit" onClick={this.handleOrganizationClick}>
              <StyledText>{ organization.name }</StyledText>
            </button>
          </Row>
        </DialogContent>
      </div>
    )
    if (this.editOrganizationOpen) {
      content = this.renderEditOrganization()
    }
    return (
      <Dialog
        open={uiStore.organizationMenuOpen}
        classes={classes}
        onClose={this.handleClose}
        aria-labelledby="form-dialog-title"
        BackdropProps={{ invisible: true }}
      >
        <StyledCloseButton onClick={this.handleClose}>
          <CloseIcon />
        </StyledCloseButton>
        { content}
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

export default withStyles(materialStyles)(OrganizationMenu)
