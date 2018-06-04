import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Notification from '~/ui/notifications/Notification'

@inject('apiStore')
@observer
class NotificationsContainer extends React.Component {
  get notifications() {
    const { apiStore } = this.props
    return apiStore
      .findAll('notifications')
      .filter(notification => !notification.read) || []
  }

  unreadCount() {
    return this.notifications.length
  }

  render() {
    const { notifications } = this
    return (
      <div>
        { notifications.map(notification => (
          <Notification notification={notification} key={notification.id} />
        ))}
      </div>
    )
  }
}

NotificationsContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default NotificationsContainer
