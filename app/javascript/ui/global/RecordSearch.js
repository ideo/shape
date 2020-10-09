import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import AutoComplete from '~/ui/global/AutoComplete'
import trackError from '~/utils/trackError'
import v from '~/utils/variables'

function formatCollections(collections) {
  return collections.map(collection => ({
    value: collection.id,
    label: collection.name,
    data: collection,
  }))
}

const AutoCompleteWrapper = styled.div`
  width: 100%;

  ${props =>
    props.smallSearchStyle &&
    `
    max-width: 350px;
    #react-select-chip {
      background-color: ${v.colors.commonLight} !important;
      border-radius: 18px !important;
    }
  `}
`

const RecordSearch = ({
  controlled,
  initialLoadAmount,
  onInputChange,
  onSearch,
  onSelect,
  searchFilter,
  searchTags,
  searchParams,
  smallSearchStyle,
  text,
}) => {
  const handleSearch = (value, callback) => debouncedSearch(value, callback)
  const debouncedSearch = _.debounce((term, callback) => {
    if (!term) {
      callback()
      return
    }
    const tags = searchTags.map(tag => `#${tag}`).join(' ')
    const params = _.merge(
      {
        query: _.trim(`${term} ${tags}`),
        per_page: 30,
      },
      searchParams
    )
    apiStore
      .searchCollections(params)
      .then(res => _.map(res.data, 'record').filter(searchFilter))
      .then(records =>
        onSearch ? onSearch(records) : callback(formatCollections(records))
      )
      .catch(e => {
        trackError(e)
      })
  }, 350)

  if (initialLoadAmount > 0) {
    debouncedSearch(' ')
  }

  return (
    <AutoCompleteWrapper smallSearchStyle={smallSearchStyle}>
      <AutoComplete
        options={[]}
        optionSearch={handleSearch}
        onOptionSelect={option => onSelect(option)}
        placeholder="Collection name"
        style={{ display: 'inline-block' }}
        keepMenuClosed={!!onSearch}
        searchValueOverride={controlled ? text : null}
        onInputChange={controlled ? onInputChange : null}
        disableUnderline={smallSearchStyle}
      />
    </AutoCompleteWrapper>
  )
}

RecordSearch.propTypes = {
  onSelect: PropTypes.func.isRequired,
  controlled: PropTypes.bool,
  onInputChange: PropTypes.func,
  onSearch: PropTypes.func,
  initialLoadAmount: PropTypes.number,
  searchFilter: PropTypes.func,
  searchTags: PropTypes.arrayOf(PropTypes.string),
  searchParams: MobxPropTypes.objectOrObservableObject,
  smallSearchStyle: PropTypes.bool,
  text: PropTypes.string,
}

RecordSearch.defaultProps = {
  controlled: false,
  initialLoadAmount: 0,
  onInputChange: null,
  onSearch: null,
  searchFilter: r => r,
  searchTags: [],
  searchParams: null,
  smallSearchStyle: false,
  text: null,
}

export default RecordSearch
