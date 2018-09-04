import { ReferenceType } from 'datx'
import { action } from 'mobx'
import BaseRecord from './BaseRecord'
import Collection from '~/stores/jsonApi/Collection'
import Item from '~/stores/jsonApi/Item'

class Activity extends BaseRecord {
  @action setTarget(value) {
    const model = value.internalType === 'collections' ? Collection : Item
    this.addReference('target', value, {
      type: ReferenceType.TO_ONE,
      model,
    })
  }

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
