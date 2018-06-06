import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { ActivityContainer } from '~/ui/global/styled/layout'
import Notification from '~/ui/notifications/Notification'

@inject('apiStore')
@observer
class NotificationsContainer extends React.Component {
  get notifications() {
    const { apiStore } = this.props
    return apiStore.unreadNotifications
  }

  unreadCount() {
    const { apiStore } = this.props
    return apiStore.unreadNotificationsCount
  }

  render() {
    const { notifications } = this
    return (
      <ActivityContainer>
        { notifications.map(notification => (
          <Notification notification={notification} key={notification.id} />
        ))}
      </ActivityContainer>
    )
  }
}

NotificationsContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default NotificationsContainer
