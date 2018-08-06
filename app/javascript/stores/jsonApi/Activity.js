import BaseRecord from './BaseRecord'

class Activity extends BaseRecord {
  static trackActivity(action, target) {
    const activity = new Activity({
      action: action,
      target_id: target.id,
      target_type: target.internalType,
    }, this.apiStore)
    activity.save()
  }

  attributesForAPI = [
    'action',
    'target_type',
    'target_id',
  ]
}

Activity.type = 'activities'
Activity.defaults = {
  target: undefined
}

export default Activity
