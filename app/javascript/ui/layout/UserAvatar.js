import { observer } from 'mobx-react'
import Avatar from 'material-ui/Avatar'
import { withStyles } from 'material-ui/styles'

const materialStyles = {
  smallAvatar: {
    width: 34,
    height: 34,
  }
}

@withStyles(materialStyles)
@observer
class UserAvatar extends React.Component {
  render() {
    const { user, classes } = this.props
    return (
      <Avatar
        className={classes.smallAvatar}
        src={user.pic_url_square}
      />
    )
  }
}

export default UserAvatar
