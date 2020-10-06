import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class Organization extends Model {
  url() {
    return `/api/v3/organizations/${this.id}`
  }
}
class OrganizationsCollection extends Collection {
  url() {
    return '/api/v3/organizations'
  }
  model() {
    return Organization
  }
}

export default new OrganizationsCollection()
