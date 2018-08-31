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
