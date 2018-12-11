import { ReferenceType } from 'datx'
import { action } from 'mobx'

import trackError from '~/utils/trackError'
import BaseRecord from './BaseRecord'
import Collection from './Collection'
import Item from './Item'
import Group from './Group'

class Activity extends BaseRecord {
  @action
  setTarget(value) {
    let model
    switch (value.internalType) {
      case 'groups':
        model = Group
        break
      case 'items':
        model = Item
        break
      case 'collections':
      default:
        model = Collection
    }
    try {
      this.addReference('target', value, {
        type: ReferenceType.TO_ONE,
        model,
      })
    } catch (e) {
      trackError(e, { source: 'Activity', name: 'setTarget' })
    }
  }

  attributesForAPI = ['action', 'target_type', 'target_id']

  static trackActivity(actionName, target) {
    const activity = new Activity(
      {
        action: actionName,
        target_id: target.id,
        target_type: target.internalType,
      },
      this.apiStore
    )
    activity.save()
  }
}

Activity.type = 'activities'
Activity.defaults = {
  target: undefined,
}

export default Activity
