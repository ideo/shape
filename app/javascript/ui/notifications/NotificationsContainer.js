import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import { ActivityContainer } from '~/ui/global/styled/layout'
import { ActivityText } from '~/ui/notifications/Activity'
import Notification from '~/ui/notifications/Notification'

const NoActivityText = ActivityText.extend`
  padding: 1.25rem;
  padding: 1rem;
`

@inject('apiStore', 'uiStore')
@observer
class NotificationsContainer extends React.Component {
  get notifications() {
    const { apiStore } = this.props
    return _.orderBy(
      apiStore.notifications,
      ['read', 'created_at'],
      ['asc', 'desc']
    )
  }

  unreadCount() {
    const { apiStore } = this.props
    return apiStore.unreadNotificationsCount
  }

  render() {
    const { uiStore } = this.props
    const { notifications } = this
    return (
      <ActivityContainer moving={uiStore.activityLogMoving}>
        {notifications.map(notification => (
          <Notification notification={notification} key={notification.id} />
        ))}
        {notifications.length === 0 && (
          <NoActivityText>
            You don&apos;t have any new notifications.
          </NoActivityText>
        )}
      </ActivityContainer>
    )
  }
}

NotificationsContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default NotificationsContainer
