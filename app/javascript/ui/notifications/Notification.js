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

  render() {
    const { notification } = this.props
    const { activity } = notification
    return (
      <Activity
        action={activity.action}
        actor={activity.actor}
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
