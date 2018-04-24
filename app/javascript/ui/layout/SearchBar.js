import _ from 'lodash'
import ReactRouterPropTypes from 'react-router-prop-types'
import { withRouter } from 'react-router-dom'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import queryString from 'query-string'
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

  svg {
    /* search icon is flipped from the designs */
    display: inline-block;
    transform: scaleX(-1);
    height: 14px;
    width: 14px;
    position: relative;
    top: 3px;
  }
  .close {
    position: absolute;
    right: 2px;
    bottom: 10px;
    color: ${v.colors.cloudy};
    &:hover {
      color: black;
    }
  }
`
StyledSearchBar.displayName = 'StyledSearchBar'

@withRouter // needed for props.location
@inject('routingStore') // needed for routeTo method
@observer
class SearchBar extends React.Component {
  @observable searchText = ''
  @observable focused = false

  constructor(props) {
    super(props)
    this.search = _.debounce(this._search, 300)

    const { location } = props
    const query = queryString.parse(location.search).q
    this.searchText = query || ''
  }

  componentDidMount() {
    const { location } = this.props
    if (location && _.startsWith(location.pathname, '/search')) {
      // if we're on the search page, focus on the search input box
      this.focusOnSearchInput()
    }
  }

  _search = (query) => {
    this.props.routingStore.routeTo('search', query)
  }

  @action updateFocus = (val) => {
    this.focused = val
  }

  handleFocus = val => () => this.updateFocus(val)

  @action updateSearchText = (text) => {
    this.searchText = text
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
        <SearchIcon />
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
  location: ReactRouterPropTypes.location.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchBar
