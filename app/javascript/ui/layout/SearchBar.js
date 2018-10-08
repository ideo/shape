import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import SearchIcon from '~/ui/icons/SearchIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledSearchBar = styled.div`
  border-bottom: 1px solid
    ${props => (props.focused ? v.colors.black : v.colors.commonDark)};
  color: ${props => (props.focused ? v.colors.black : v.colors.commonDark)};
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
      color: ${v.colors.commonDark};
    }
  }

  .icon {
    display: inline;
  }

  .search {
    color: ${props => (props.focused ? v.colors.black : v.colors.commonDark)};
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
    color: ${v.colors.commonDark};
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

@observer
class SearchBar extends React.Component {
  @observable
  focused = false

  @action
  updateFocus = val => {
    this.focused = val
  }

  handleFocus = val => () => this.updateFocus(val)

  handleTextChange = ev => {
    this.props.onChange(ev.target.value)
  }

  clearSearch = () => {
    const { onClear } = this.props
    onClear && onClear()
  }

  focusOnSearchInput = () => {
    const { value } = this.props
    const { searchInput } = this
    searchInput.focus()
    // clear out value
    searchInput.value = ''
    // re-input value so that cursor is now at the end of the text
    searchInput.value = value
  }

  render() {
    const { value } = this.props
    return (
      <StyledSearchBar focused={this.props.focused || this.focused}>
        <span className="search">
          <SearchIcon />
        </span>
        <input
          ref={input => {
            this.searchInput = input
          }}
          type="text"
          placeholder="search..."
          value={value}
          onFocus={this.handleFocus(true)}
          onBlur={this.handleFocus(false)}
          onChange={this.handleTextChange}
        />
        {value && (
          <button onClick={this.clearSearch} className="close">
            <CloseIcon />
          </button>
        )}
      </StyledSearchBar>
    )
  }
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  focused: PropTypes.bool,
}

SearchBar.defaultProps = {
  focused: false,
}

export default SearchBar
