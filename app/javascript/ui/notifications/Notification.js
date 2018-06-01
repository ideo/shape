import { PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'
import { apiStore } from '~/stores'

import Activity from '~/ui/notifications/Activity'
import InlineLoader from '~/ui/layout/InlineLoader'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

class Notification extends React.PureComponent {
  componentWillMount() {
    const { notification } = this.props
    const { activity } = notification
    const targetType = pluralTypeName(activity.target_type)
    const target = apiStore.find(targetType, activity.target_id)
    if (!target) {
      apiStore.fetch(targetType, activity.target_id).then(res => {
        activity.assignRef('target', res.data)
      }).catch((err) => console.warn(err))
    } else {
      activity.assignRef('target', target)
    }
  }

  updateRead() {
    const { notification } = this.props
    notification.read = true
    notification.save()
  }

  combineActors() {
    const { notification } = this.props
    if (!notification.combined_activities_ids.length) {
      return [notification.activity.actor]
    }
    return notification.combined_activities.map(activity =>
      activity.actor)
  }

  handleRead = (ev) => {
    ev.preventDefault()
    this.updateRead()
  }

  render() {
    const { notification } = this.props
    const { activity } = notification
    // TODO we don't actually want a loader for each notification
    if (!activity.target) return <InlineLoader />
    return (
      <div>
        <button className="read" onClick={this.handleRead}>M</button>
        <Activity
          action={activity.action}
          actors={this.combineActors()}
          target={activity.target}
          subjectUsers={activity.subjectUsers}
          subjectGroups={activity.subjectGroups}
          actorCount={notification.combined_activities_ids.length}
          content={activity.content}
        />
      </div>
    )
  }
}

Notification.propTypes = {
  notification: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Notification
