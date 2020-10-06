import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class UserModel extends Model {
  url() {
    return `/api/v3/users/me`
  }
}

class UsersCollection extends Collection {
  // use .rpc({ endpoint: /api/v3/users/me }) for non-rest calls
  url() {
    return `/api/v3/users`
  }

  model() {
    return UserModel
  }
}

// singleton
export default new UsersCollection()
