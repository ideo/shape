import BaseRecord from './BaseRecord'

class Activity extends BaseRecord {
  attributesForAPI = [
    'action',
    'target_type',
    'target_id',
  ]

  static trackActivity(action, target) {
    const activity = new Activity({
      action,
      target_id: target.id,
      target_type: target.internalType,
    }, this.apiStore)
    activity.save()
  }
}

Activity.type = 'activities'
Activity.defaults = {
  target: undefined
}

export default Activity
