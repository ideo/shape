import { action } from 'mobx'
import { LocaleStore as BaseLocaleStore } from 'mobx-react-intl'
import { addLocaleData } from 'react-intl'
import enLocale from 'react-intl/locale-data/en'

addLocaleData([...enLocale])

class LocaleStore extends BaseLocaleStore {
  @action setLanguage(value) {
    this.value = value
  }
}

// first param indicates default language
// `en` is just an empty object because English messages come from defaultMessage attrs
export default new LocaleStore('en', { en: {} })
