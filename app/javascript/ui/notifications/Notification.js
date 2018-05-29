import { PropTypes as MobxPropTypes } from 'mobx-react'

import Activity from '~/ui/notifications/Activity'

class Notification extends React.PureComponent {
  componentDidMount() {
    this.updateRead()
  }

  updateRead() {
    const { notification } = this.props
    notification.read = true
    notification.save()
  }

  combineActors() {
    const { notification } = this.props
    if (!notification.combined_activities || !notification.combined_activities.length) {
      return [notification.activity.actor]
    }
    return notification.combined_activities.map(activity =>
      activity.actor)
  }

  render() {
    const { notification } = this.props
    const { activity } = notification
    return (
      <Activity
        action={activity.action}
        actors={this.combineActors()}
        target={activity.target}
        subjectUsers={activity.subjectUsers}
        subjectGroups={activity.subjectGroups}
      />
    )
  }
}

Notification.propTypes = {
  notification: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Notification
