import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'

@observer
class UserAvatar extends React.Component {
  render() {
    const { user, className, size } = this.props
    return (
      <Avatar
        title={user.name}
        size={size}
        className={className}
        url={user.filestack_file_url}
      />
    )
  }
}

UserAvatar.propTypes = {
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
}

UserAvatar.defaultProps = {
  size: 34,
  className: '',
}

export default UserAvatar
