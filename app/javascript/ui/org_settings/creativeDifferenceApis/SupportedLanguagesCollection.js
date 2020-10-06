import adapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'
import baseUrl from '../utils/baseUrl'

apiClient(adapter, {
  apiPath: baseUrl(''),
})

class SupportedLanguageModel extends Model {}

class SupportedLanguagesCollection extends Collection {
  url() {
    return `/api/v3/supported_languages`
  }

  model() {
    return SupportedLanguageModel
  }
}

// singleton
export default new SupportedLanguagesCollection()
