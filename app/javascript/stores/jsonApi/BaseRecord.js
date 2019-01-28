import { computed } from 'mobx'
import { Model, initModelRef, setModelMetaKey } from 'datx'
import { jsonapi, modelToJsonApi } from 'datx-jsonapi'
import _ from 'lodash'

// NOTE: DATX_PERSISTED_KEY matches internals in datx, they don't export this;
// so it is possible that this could change when updating datx.
const DATX_PERSISTED_KEY = 'jsonapiPersisted'

class BaseRecord extends jsonapi(Model) {
  constructor(...args) {
    super(...args)
    if (this.constructor.refDefaults) {
      _.forEach(this.constructor.refDefaults, (v, k) => {
        const { defaultValue, ...options } = v
        initModelRef(this, k, options, defaultValue)
      })
    }
  }

  @computed
  get id() {
    return this.meta.id
  }

  get persisted() {
    return !!this.id && this.id > 0
  }

  get apiStore() {
    return this.meta.collection
  }

  get internalType() {
    return this.meta.type
  }

  get baseApiPath() {
    return `${this.internalType}/${this.id}`
  }

  get className() {
    // very simple version of singularize, just cut off the 's' at the end
    const name = this.internalType.slice(0, -1)
    return _.capitalize(_.camelCase(name))
  }

  get identifier() {
    return `${this.internalType}${this.id}`
  }

  // applies to items/collections
  get breadcrumbSize() {
    return this.breadcrumb ? this.breadcrumb.length : 0
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
    delete data.relationships
    return data
  }

  refetch() {
    this.apiStore.fetch(this.internalType, this.id, true)
  }

  async create() {
    // similar to datx save but using our toJsonApi() to scrub the data
    const res = await this.apiStore.request(`${this.internalType}`, 'POST', {
      data: this.toJsonApi(),
    })
    setModelMetaKey(this, DATX_PERSISTED_KEY, true)
    return res.replaceData(this).data
  }

  // not called `update` because that's already a thing
  patch() {
    this.apiStore.request(`${this.internalType}/${this.id}`, 'PATCH', {
      data: this.toJsonApi(),
    })
  }
}

export default BaseRecord
