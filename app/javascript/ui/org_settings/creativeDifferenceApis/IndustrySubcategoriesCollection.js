import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class IndustrySubcategoryModel extends Model {}

class IndustrySubcategoriesCollection extends Collection {
  url() {
    return `/api/v1/creative_difference/proxy?url=industry_subcategories`
  }
  model() {
    return IndustrySubcategoryModel
  }
}

// singleton
export default new IndustrySubcategoriesCollection()
