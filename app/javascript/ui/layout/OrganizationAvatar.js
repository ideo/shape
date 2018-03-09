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

@inject('uiStore')
@observer
class OrganizationAvatar extends React.Component {
  handleClick = (ev) => {
    const { onClickOverride, uiStore, organization } = this.props
    if (onClickOverride) {
      onClickOverride(ev)
    } else {
      uiStore.openOrganizationMenu(organization)
    }
  }

  render() {
    const { classes, organization } = this.props
    return (
      <Avatar
        onClick={this.handleClick}
        className={classes.smallAvatar}
        src={organization.pic_url_square}
      />
    )
  }
}

OrganizationAvatar.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  classes: PropTypes.shape({
    smallAvatar: PropTypes.string,
  }).isRequired,
  onClickOverride: PropTypes.func,
}
OrganizationAvatar.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// apply the wrapper here so that it doesn't interfere with propType definition
export default withStyles(materialStyles)(OrganizationAvatar)
