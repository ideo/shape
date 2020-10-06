import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class ApiTokenModel extends Model {}

class ApiTokensCollection extends Collection {
  url() {
    return `/api/v3/api_tokens`
  }

  model() {
    return ApiTokenModel
  }
}

// singleton
export default new ApiTokensCollection()
