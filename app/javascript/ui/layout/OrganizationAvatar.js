import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Avatar from 'material-ui/Avatar'
import { withStyles } from 'material-ui/styles'

const materialStyles = {
  smallAvatar: {
    width: 34,
    marginLeft: 5,
    marginRight: 5,
    height: 34,
    cursor: 'pointer'
  }
}

const DEFAULT_URL = 'https://cdn.filestackcontent.com/XYWsMijFTDWBsGzzKEEo'

@inject('uiStore')
@observer
class OrganizationAvatar extends React.Component {
  handleClick = (ev) => {
    const { uiStore, organization } = this.props
    uiStore.openOrganizationMenu(organization)
  }

  render() {
    const { classes, organization } = this.props
    const url = organization.pic_url_square || DEFAULT_URL
    return (
      <Avatar
        onClick={this.handleClick}
        className={classes.smallAvatar}
        src={url}
      />
    )
  }
}

OrganizationAvatar.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  classes: PropTypes.shape({
    smallAvatar: PropTypes.string,
  }).isRequired,
}
OrganizationAvatar.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// apply the wrapper here so that it doesn't interfere with propType definition
export default withStyles(materialStyles)(OrganizationAvatar)
