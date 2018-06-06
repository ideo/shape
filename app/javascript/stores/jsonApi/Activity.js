import BaseRecord from './BaseRecord'

class Activity extends BaseRecord {}

Activity.type = 'activities'
Activity.defaults = {
  target: undefined
}

export default Activity
