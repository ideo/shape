import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Avatar from 'material-ui/Avatar'
import { withStyles } from 'material-ui/styles'

const materialStyles = {
  smallAvatar: {
    width: 34,
    marginLeft: 5,
    marginRight: 5,
    height: 34,
  }
}

@observer
class OrganizationAvatar extends React.Component {
  render() {
    const { classes } = this.props
    return (
      <Avatar
        className={classes.smallAvatar}
        src={'https://d3none3dlnlrde.cloudfront.net/assets/users/avatars/missing/square.jpg'}
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

// apply the wrapper here so that it doesn't interfere with propType definition
export default withStyles(materialStyles)(OrganizationAvatar)
