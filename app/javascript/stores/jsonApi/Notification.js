import { ReferenceType } from 'datx'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'
import User from './User'

class Notification extends BaseRecord {
  static type = 'notifications'
  static endpoint = apiUrl('notifications')

  attributesForAPI = ['read']
}

Notification.refDefaults = {
  combined_actors: {
    model: User,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Notification
