import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import SearchBar from '~/ui/layout/SearchBar'

@inject('routingStore', 'uiStore') // needed for routeTo method
@observer
class GlobalSearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.search = _.debounce(this._search, 300)
  }

  get searchText() {
    return this.props.uiStore.searchText
  }

  _search = query => {
    const { routingStore } = this.props
    if (!query || query === '') return routingStore.leaveSearch()
    return routingStore.routeTo('search', query.replace(/#/g, '%23'))
  }

  updateSearchText = text => {
    this.props.uiStore.update('searchText', text)
    // perform a debounced search
    this.search(this.searchText)
  }

  handleTextChange = value => {
    this.updateSearchText(value)
  }

  clearSearch = () => this.updateSearchText('')

  render() {
    const { routingStore } = this.props
    return (
      <div id="test-globalSearch">
        <SearchBar
          focused={routingStore.pathContains('/search')}
          value={this.searchText}
          onChange={this.handleTextChange}
          onClear={this.clearSearch}
        />
      </div>
    )
  }
}

GlobalSearchBar.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GlobalSearchBar
