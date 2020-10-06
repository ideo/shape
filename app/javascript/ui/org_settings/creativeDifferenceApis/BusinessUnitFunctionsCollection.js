import { Collection, Model } from 'mobx-rest'

class BusinessUnitFunctionModel extends Model {}

class BusinessUnitFunctionsCollection extends Collection {
  // use .rpc(options) for non-rest calls like ?business_unit_id=${businessUnitId}`
  url() {
    return '/api/v3/business_unit_functions'
  }
  model() {
    return BusinessUnitFunctionModel
  }
}

// singleton
export default new BusinessUnitFunctionsCollection()
