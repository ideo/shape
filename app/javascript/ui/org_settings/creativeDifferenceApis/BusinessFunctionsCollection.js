import { Collection, Model } from 'mobx-rest'

class BusinessFunctionModel extends Model {}

class BusinessFunctionsCollection extends Collection {
  // use .rpc({ endpoint: /api/v3/users/me }) for non-rest calls
  url() {
    return '/api/v3/business_functions'
  }
  model() {
    return BusinessFunctionModel
  }
}

// singleton
export default new BusinessFunctionsCollection()
