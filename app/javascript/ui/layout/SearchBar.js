import _ from 'lodash'
import ReactRouterPropTypes from 'react-router-prop-types'
import { withRouter } from 'react-router-dom'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

@withRouter
@inject('routingStore')
@observer
class SearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.search = _.debounce(this._search, 300)
    this.searchText = props.match.params.query || ''
  }

  componentDidMount() {
    const { match } = this.props
    if (match && match.params.query && _.startsWith(match.path, '/search')) {
      // if we're on the search page, focus on the search input box
      this.focusOnSearchInput()
    }
  }

  focusOnSearchInput = () => {
    const { searchInput } = this
    searchInput.focus()
    // clear out value
    searchInput.value = ''
    // re-input value so that cursor is now at the end of the text
    searchInput.value = this.searchText
  }

  @observable searchText = ''

  @action updateText = (ev) => {
    this.searchText = ev.target.value
    this.search(this.searchText)
  }

  _search = (query) => {
    this.props.routingStore.routeTo('search', query)
  }

  render() {
    return (
      <div>
        <input
          ref={(input) => { this.searchInput = input }}
          type="text"
          placeholder="Search me!"
          value={this.searchText}
          onChange={this.updateText}
        />
      </div>
    )
  }
}

SearchBar.wrappedComponent.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchBar
