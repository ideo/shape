import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'

import AutoComplete from '~/ui/global/AutoComplete'

@inject('apiStore')
@observer
class RecordSearch extends React.Component {
  constructor(props) {
    super(props)
    this.debouncedSearch = _.debounce((term, callback) => {
      if (!term) {
        callback()
        return
      }

      this.props.apiStore
        .searchCollections({
          query: term,
          per_page: 30,
          filter: props.filter,
        })
        .then(res => callback(formatCollections(res.data)))
        .catch(e => {
          trackError(e)
        })
    }, 350)
  }

  onSearch = (value, callback) => this.debouncedSearch(value, callback)

  render() {
    return (
      <AutoComplete
        options={[]}
        optionSearch={this.onSearch}
        onOptionSelect={option => this.props.onSelect(option)}
        placeholder="Collection name"
        keepSelectedOptions
        style={{ display: 'inline-block' }}
      />
    )
  }
}

RecordSearch.propTypes = {
  initalLoadAmount: PropTypes.number,
  filter: PropTypes.func,
}

RecordSearch.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  filter: r => r,
}

RecordSearch.defaultProps = {
  initalLoadAmount: 0,
}
