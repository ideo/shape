import { Record } from 'mobx-jsonapi-store'
import _ from 'lodash'

class BaseRecord extends Record {
  rawAttributes() {
    return super.toJsonApi().attributes
  }

  // whitelist attributes when sending to the API
  toJsonApi() {
    const data = super.toJsonApi()
    if (this.attributesForAPI) {
      data.attributes = _.pick(data.attributes, this.attributesForAPI)
    }
    return data
  }
}

export default BaseRecord
