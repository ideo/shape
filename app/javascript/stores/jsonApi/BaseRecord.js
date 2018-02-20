import { Record } from 'mobx-jsonapi-store'
import _ from 'lodash'

class BaseRecord extends Record {
  get apiStore() {
    // alias to reference the apiStore, also to be less confusing about "collection"
    // which comes from mobx-collection-store
    return this.__collection
  }

  rawAttributes() {
    return super.toJsonApi().attributes
  }

  // override to allow whitelist of attributes when sending to the API
  toJsonApi() {
    const data = super.toJsonApi()
    if (this.attributesForAPI) {
      data.attributes = _.pick(data.attributes, this.attributesForAPI)
    }
    return data
  }
}

export default BaseRecord
