import { ReferenceType } from 'datx'
import BaseRecord from './BaseRecord'
import User from './User'

class Notification extends BaseRecord {
  attributesForAPI = ['read']
}

Notification.type = 'notifications'

Notification.refDefaults = {
  combined_actors: {
    model: User,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Notification
