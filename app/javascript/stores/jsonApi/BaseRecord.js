import { Model, initModelRef } from 'datx'
import { jsonapi, modelToJsonApi } from 'datx-jsonapi'
import _ from 'lodash'

class BaseRecord extends jsonapi(Model) {
  constructor(...args) {
    super(...args)
    if (this.constructor.refDefaults) {
      _.forEach(this.constructor.refDefaults, (v, k) => {
        const {defaultValue, ...options} = v
        initModelRef(this, k, options, defaultValue);
      })
    }
  }

  get persisted() {
    return !!this.meta.id
  }

  get apiStore() {
    return this.meta.collection
  }

  get internalType() {
    return this.meta.type
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
    return modelToJsonApi(this).attributes
  }

  // override to allow whitelist of attributes when sending to the API
  toJsonApi() {
    const data = modelToJsonApi(this)
    if (this.attributesForAPI) {
      data.attributes = _.pick(data.attributes, this.attributesForAPI)
    }
    return data
  }
}

export default BaseRecord
