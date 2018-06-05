import BaseRecord from './BaseRecord'

class Notification extends BaseRecord {
  attributesForAPI = ['read']
}

Notification.type = 'notifications'
Notification.defaults = {
  // set as array so it's never `undefined`
  combined_activities: [],
  combined_activities_ids: [],
  activity: undefined,
}

export default Notification
