import BaseRecord from './BaseRecord'

class Notification extends BaseRecord {
  attributesForAPI = ['read']
}

Notification.type = 'notifications'
Notification.defaults = {
  // set as array so it's never `undefined`
  combined_actors: [],
  combined_activities_ids: [],
  // Set this undefined by default so assignRef will pick up the change
  activity: undefined,
}

export default Notification
