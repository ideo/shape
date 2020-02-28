import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import SearchIcon from '~/ui/icons/SearchIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledExpandableSearchInput = styled.div`
  border-radius: 20px;
  background: ${props => props.background};
  position: relative;
  min-width: 32px;
  max-width: ${props => (props.open ? '250px' : '32px')};
  width: 100%;
  height: 32px;
  text-align: center;
  display: flex;
  align-items: center;
  transition: all 0.5s ease-in-out;
  /* So this gets clicked instead of search deleted content checkbox */
  z-index: 2;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    /* encourage input width to take up the full screen minus our 16px viewport gutters */
    max-width: ${props => (props.open ? 'calc(100vw - 32px)' : '0px')};
    width: 100vw;
  }

  input {
    flex: 1 1 auto;
    font-size: 1rem;
    background: none;
    outline: none;
    border: none;
    margin-right: ${props => (props.open ? '30px' : '0px')};
    transition: all 0.5s ease-in-out;
    width: 100%;
    &::placeholder {
      color: ${v.colors.commonDark};
    }

    &:disabled {
      color: ${v.colors.commonDark};
    }
  }

  .icon {
    display: inline;
  }

  .search {
    color: ${v.colors.black};
    flex: 0 0 auto;
    padding: 0px 4px;
    svg {
      display: inline-block;
      height: 22px;
      margin-bottom: -7px;
      margin-left: 5px;
      padding-top: 4px;
      width: 22px;
    }
  }

  .close {
    position: absolute;
    right: 10px;
    bottom: 4px;
    color: ${v.colors.commonDark};
    visibility: ${props => (props.open ? 'visible' : 'hidden')};
    opacity: ${props => (props.open ? '1' : '0')};
    transition: opacity 0.5s linear 0.5s;
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
StyledExpandableSearchInput.displayName = 'StyledExpandableSearchInput'

@observer
class ExpandableSearchInput extends React.Component {
  @observable
  open = false

  constructor(props) {
    super(props)
    runInAction(() => {
      this.open = props.defaultOpen
    })
  }

  componentDidUpdate() {
    runInAction(() => {
      if (this.props.controlled && this.open !== this.props.open) {
        this.open = this.props.open
      }
    })
  }

  @action
  updateOpen = val => {
    if (!this.props.controlled) {
      this.open = val
    }
    this.props.onToggle(val)
    if (val && this.searchInput) {
      this.searchInput.focus()
    }
  }

  handleOpen = val => () => this.updateOpen(val)

  handleTextChange = ev => {
    if (this.props.disabled) return
    this.props.onChange(ev.target.value)
  }

  handleClose = ev => {
    if (this.open) {
      this.updateOpen(false)
    }
    this.clearSearch()
  }

  clearSearch = () => {
    const { onClear } = this.props
    onClear && onClear()
  }

  render() {
    const { value, background, disabled, onClear, dataCy } = this.props
    const { open } = this
    return (
      <StyledExpandableSearchInput open={open} background={background}>
        <button className="search" onClick={this.handleOpen(true)}>
          <SearchIcon />
        </button>
        <input
          ref={input => {
            this.searchInput = input
          }}
          type="text"
          placeholder="search..."
          value={value}
          onChange={this.handleTextChange}
          disabled={disabled}
          data-cy={dataCy}
        />
        {!!onClear && (
          <button open={open} onClick={this.handleClose} className="close">
            <CloseIcon />
          </button>
        )}
      </StyledExpandableSearchInput>
    )
  }
}

ExpandableSearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  onToggle: PropTypes.func,
  defaultOpen: PropTypes.bool,
  background: PropTypes.string,
  controlled: PropTypes.bool,
  open: PropTypes.bool,
  disabled: PropTypes.bool,
  dataCy: PropTypes.string,
}

ExpandableSearchInput.defaultProps = {
  onClear: null,
  defaultOpen: false,
  forceClose: false,
  background: v.colors.commonLightest,
  onToggle: () => {},
  controlled: false,
  open: false,
  disabled: false,
  dataCy: '',
}

export default ExpandableSearchInput
