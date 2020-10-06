import { Collection, Model } from 'mobx-rest'

class DeploymentModel extends Model {}

class DeploymentsCollection extends Collection {
  // use .rpc({ endpoint: 'string here' }) for non-REST calls like open/close
  url() {
    return '/api/v3/deployments'
  }
  model() {
    return DeploymentModel
  }
}

// singleton
export default new DeploymentsCollection()
