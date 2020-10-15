import { computed, runInAction, toJS } from 'mobx'
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

  get apiStore() {
    // this datx collection is the apiStore
    return this.meta.collection
  }

  get uiStore() {
    // uiStore gets supplied via apiStore
    return this.apiStore.uiStore
  }

  get routingStore() {
    // routingStore gets supplied via apiStore
    return this.apiStore.routingStore
  }

  get undoStore() {
    // undoStore gets supplied via apiStore
    return this.apiStore.undoStore
  }

  @computed
  get id() {
    return this.meta.id
  }

  // We call `type` (the STI attribute) `class_type` in the API so that it doesn't confuse json-api-client
  // however the frontend still refers to it as `type`
  get type() {
    return this.class_type
  }

  set type(t) {
    this.class_type = t
  }

  get persisted() {
    return !!this.id && this.id > 0
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
      data.attributes = toJS(_.pick(data.attributes, this.attributesForAPI))
    }
    delete data.relationships
    return data
  }

  refetch() {
    return this.apiStore.fetch(this.internalType, this.id, true)
  }

  async create(extraPath = '') {
    // similar to datx save but using our toJsonApi() to scrub the data
    const res = await this.apiStore.request(
      `${this.internalType}${extraPath}`,
      'POST',
      {
        data: this.toJsonApi(),
      }
    )
    setModelMetaKey(this, DATX_PERSISTED_KEY, true)
    res.replaceData(this)
    return res
  }

  // not called `update` because that's already a thing
  patch(additionalData = {}) {
    const data = {
      // the model attributes will get nested in { attributes: ... }
      ...this.toJsonApi(),
      // additionalData could include { cancel_sync: true }
      ...additionalData,
    }
    return this.apiStore.request(this.baseApiPath, 'PATCH', {
      data,
    })
  }

  async destroy() {
    await this.apiStore.request(this.baseApiPath, 'DELETE')
    this.apiStore.remove(this.internalType, this.id)
    runInAction(() => {
      setModelMetaKey(this, DATX_PERSISTED_KEY, false)
    })
  }
}

export default BaseRecord
