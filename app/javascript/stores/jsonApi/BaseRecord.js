import { Record } from 'mobx-jsonapi-store'
import _ from 'lodash'

class BaseRecord extends Record {
  get apiStore() {
    // alias to reference the apiStore, also to be less confusing about "collection"
    // which comes from mobx-collection-store
    return this.__collection
  }

  get internalType() {
    return this.__internal.type
  }

  get className() {
    // very simple version of singularize, just cut off the 's' at the end
    const name = this.internalType.slice(0, -1)
    return _.capitalize(_.camelCase(name))
  }

  get identifier() {
    return `${this.internalType}${this.id}`
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
