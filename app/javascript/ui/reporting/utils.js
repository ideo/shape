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
      .then(res => {
        let results = res.data
        if (functionName === 'searchCollections') {
          results = _.map(results, 'record')
        }
        callback(formatSearchData(results))
      })
      .catch(e => {
        trackError(e)
      })
  }, wait)
}
