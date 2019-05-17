import _ from 'lodash'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import SearchButton from '~/ui/global/SearchButton'

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
    if (!query) this.clearSearch()
    const { routingStore } = this.props
    return routingStore.routeTo('search', query)
  }

  updateSearchText = text => {
    this.props.uiStore.update('searchText', text)
    // perform a debounced search
    this.search(this.searchText)
  }

  handleTextChange = value => {
    this.updateSearchText(value)
  }

  clearSearch = () => {
    this.props.routingStore.leaveSearch()
  }

  render() {
    const { routingStore, open } = this.props
    return (
      <SearchButton
        background="white"
        open={open}
        focused={routingStore.pathContains('/search')}
        value={this.searchText}
        onChange={this.handleTextChange}
        onClear={this.clearSearch}
      />
    )
  }
}

GlobalSearchBar.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GlobalSearchBar.propTypes = {
  open: PropTypes.bool,
}

GlobalSearchBar.defaultProps = {
  open: false,
}

export default GlobalSearchBar
