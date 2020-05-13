import _ from 'lodash'
import trackError from '~/utils/trackError'
import { apiStore } from '~/stores'

export function formatSearchData(records) {
  return records.map(record => ({
    value: record.id,
    label: record.name,
    data: record,
  }))
}

export function debouncedAutocompleteSearch(functionName, wait = 350) {
  return _.debounce((term, callback) => {
    if (!term) {
      callback()
      return
    }

    apiStore[functionName]({
      query: term,
      per_page: 30,
    })
      .then(res => callback(formatSearchData(res.data)))
      .catch(e => {
        trackError(e)
      })
  }, wait)
}
