import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { ActivityContainer } from '~/ui/global/styled/layout'
import { ActivityText } from '~/ui/notifications/Activity'
import Notification from '~/ui/notifications/Notification'

const NoActivityText = ActivityText.extend`
  padding: 1.25rem;
  padding: 1rem;
`

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
        { notifications.length === 0 &&
          <NoActivityText>
            You don&apos;t have any new notifications.
          </NoActivityText>
        }
      </ActivityContainer>
    )
  }
}

NotificationsContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default NotificationsContainer
