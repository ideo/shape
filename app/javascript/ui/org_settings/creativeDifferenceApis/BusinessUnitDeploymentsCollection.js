import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class BusinessUnitDeploymentModel extends Model {
  url() {
    // Do this conditionally because otherwise it tries to use the /:id for creating
    return this.id
      ? `/api/v3/business_unit_deployments/${this.id}`
      : `/api/v3/business_unit_deployments`
  }
}

class BusinessUnitDeploymentsCollection extends Collection {
  // use .rpc({ endpoint: /api/v3/users/me }) for non-rest calls
  url() {
    return `/api/v3/business_unit_deployments`
  }
  model() {
    return BusinessUnitDeploymentModel
  }
}

// singleton
export default new BusinessUnitDeploymentsCollection()
