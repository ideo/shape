import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import AutoComplete from '~/ui/global/AutoComplete'
import trackError from '~/utils/trackError'

function formatCollections(collections) {
  return collections.map(collection => ({
    value: collection.id,
    label: collection.name,
    data: collection,
  }))
}

@inject('apiStore')
@observer
class RecordSearch extends React.Component {
  constructor(props) {
    super(props)
    this.debouncedSearch = _.debounce((term, callback) => {
      console.log({ term })
      if (!term) {
        console.log('no term')
        callback()
        return
      }
      const tags = props.searchTags.map(tag => `#${tag}`).join(' ')
      props.apiStore
        .searchCollections({
          query: `${tags} ${term}`,
          per_page: 30,
        })
        .then(res => res.data.filter(props.searchFilter))
        .then(records =>
          props.onSearch
            ? props.onSearch(records)
            : callback(formatCollections(records))
        )
        .catch(e => {
          console.log(e, 'error in promise')
          trackError(e)
        })
    }, 350)
  }

  componentDidMount() {
    const { initialLoadAmount } = this.props
    if (initialLoadAmount > 0) {
      console.log('blank debounded search')
      this.debouncedSearch(' ')
    }
  }

  onSearch = (value, callback) => this.debouncedSearch(value, callback)

  render() {
    return (
      <AutoComplete
        options={[]}
        optionSearch={this.onSearch}
        onOptionSelect={option => this.props.onSelect(option)}
        placeholder="Collection name"
        style={{ display: 'inline-block' }}
        keepMenuClosed={!!this.props.onSearch}
      />
    )
  }
}

RecordSearch.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  initialLoadAmount: PropTypes.number,
  searchFilter: PropTypes.func,
  searchTags: PropTypes.arrayOf(PropTypes.string),
}

RecordSearch.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

RecordSearch.defaultProps = {
  onSearch: null,
  initialLoadAmount: 0,
  searchFilter: r => r,
  searchTags: [],
}

export default RecordSearch
