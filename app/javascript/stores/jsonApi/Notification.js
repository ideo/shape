import BaseRecord from './BaseRecord'

class Notification extends BaseRecord {
  attributesForAPI = ['read']
}

Notification.type = 'notifications'

export default Notification
