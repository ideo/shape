import _ from 'lodash'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import SearchIcon from '~/ui/icons/SearchIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledSearchBar = styled.div`
  border-bottom: 1px solid ${props => (props.focused ? v.colors.blackLava : v.colors.cloudy)};
  color: ${props => (props.focused ? v.colors.blackLava : v.colors.cloudy)};
  height: 28px;
  margin-right: 16px;
  position: relative;
  width: 205px;
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 140px;
  }

  input {
    display: inline-block;
    width: 60%;
    font-size: 1rem;
    padding-left: 14px;
    background: none;
    outline: none;
    border: none;
    &::placeholder {
      color: ${v.colors.cloudy};
    }
  }

  .icon {
    display: inline;
  }

  .search {
    color: ${props => (props.focused ? v.colors.blackLava : v.colors.cloudy)};
    svg {
      display: inline;
      height: 18px;
      margin-bottom: -7px;
      padding-top: 4px;
      width: 18px;
    }
  }

  .close {
    position: absolute;
    right: 2px;
    bottom: 7px;
    color: ${v.colors.cloudy};
    &:hover {
      color: black;
    }
    svg {
      display: inline;
      padding-top: 4px;
      height: 14px;
      width: 14px;
    }
  }
`
StyledSearchBar.displayName = 'StyledSearchBar'

@inject('routingStore', 'uiStore') // needed for routeTo method
@observer
class SearchBar extends React.Component {
  @observable focused = false

  constructor(props) {
    super(props)
    this.search = _.debounce(this._search, 300)
  }

  componentDidMount() {
    const { routingStore } = this.props
    if (routingStore.pathContains('/search')) {
      // if we're on the search page, focus on the search input box
      this.focusOnSearchInput()
    }
  }

  get searchText() {
    return this.props.uiStore.searchText
  }

  _search = (query) => {
    const { routingStore } = this.props
    if (!query || query === '') return routingStore.leaveSearch()
    return routingStore.routeTo('search', query)
  }

  @action updateFocus = (val) => {
    this.focused = val
  }

  handleFocus = val => () => this.updateFocus(val)

  updateSearchText = (text) => {
    this.props.uiStore.update('searchText', text)
    // perform a debounced search
    this.search(this.searchText)
  }

  handleTextChange = (ev) => {
    this.updateSearchText(ev.target.value)
  }

  clearSearch = () => this.updateSearchText('')

  focusOnSearchInput = () => {
    const { searchInput } = this
    searchInput.focus()
    // clear out value
    searchInput.value = ''
    // re-input value so that cursor is now at the end of the text
    searchInput.value = this.searchText
  }

  render() {
    return (
      <StyledSearchBar focused={this.focused}>
        <span className="search">
          <SearchIcon />
        </span>
        <input
          ref={(input) => { this.searchInput = input }}
          type="text"
          placeholder="search..."
          value={this.searchText}
          onFocus={this.handleFocus(true)}
          onBlur={this.handleFocus(false)}
          onChange={this.handleTextChange}
        />
        {this.searchText &&
          <button onClick={this.clearSearch} className="close">
            <CloseIcon />
          </button>
        }
      </StyledSearchBar>
    )
  }
}

SearchBar.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchBar
