import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class ContentVersionModel extends Model {}

class ContentVersionsCollection extends Collection {
  url() {
    return `/api/v1/creative_difference/proxy?url=content_versions`
  }

  model() {
    return ContentVersionModel
  }
}

// singleton
export default new ContentVersionsCollection()
