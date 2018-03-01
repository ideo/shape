import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, propTypes as MobxPropTypes } from 'mobx-react'

import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import MenuIcon from '~/ui/icons/MenuIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import v from '~/utils/variables'

export const StyledMenu = styled.div`
  position: relative;
  ul {
    position: absolute;
    top: 20px;
    left: 0;
    display: none;
    background-color: #FFFFFF;
    width: 200px;
  }
  &.open ul {
    display: block;
  }
`

export const StyledMenuToggle = styled.button`
  .icon {
    -webkit-transform: rotate(90deg);
    -moz-transform: rotate(90deg);
    -o-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    transform: rotate(90deg);
    width: 24px;
    height: 24px;
  }
`

export const StyledMenuItem = styled.li`
  button {
    width: 100%;
    padding-left: 1rem;
    line-height: 2.5rem;
    text-transform: uppercase;
    position: relative;
    border-left: 3px solid transparent;
    font-family: 'Gotham';
    font-weight: 300;
    font-size: 0.8rem;
    text-align: left;
    border-bottom: 1px solid ${v.colors.cyanLight};
    color: ${v.colors.darkCharcoal};
    .icon {
      top: 50%;
      transform: translateY(-50%);
      position: absolute;
      right: 1.5rem;
      width: 16px;
      height: 16px;
      line-height: 1.4rem;
    }
  }
  &:hover,
  &:active {
    button {
      border-left: 3px solid ${v.colors.darkCharcoal};
      background-color: ${v.colors.cyanLight};
    }
  }
`

@inject('uiStore')
class CardMenu extends React.PureComponent {
  state = {
    open: false
  }

  get cardId() {
    return this.props.cardId
  }

  setOpen = (open, closeOthers = true) => {
    if (open && closeOthers) {
      // Close any other open menus
      this.props.uiStore.cardMenuOpened(this)
    }

    this.setState({
      open: open
    })
  }

  handleMouseLeave = () => {
    if (this.state.open) {
      this.setOpen(false, false)
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    this.setOpen(!this.state.open)
  }

  render() {
    const { className } = this.props
    let css = className || ''
    if (this.state.open) {
      css += ' open'
    }
    return (
      <StyledMenu
        className={css}
        role="presentation"
        onMouseLeave={this.handleMouseLeave}
      >
        <StyledMenuToggle onClick={this.toggleOpen}>
          <MenuIcon />
        </StyledMenuToggle>
        <ul>
          <StyledMenuItem>
            <button onClick={this.props.handleDuplicate}>
              Duplicate
              <DuplicateIcon />
            </button>
          </StyledMenuItem>
          <StyledMenuItem>
            <button onClick={this.props.handleLink}>
              Link
              <LinkIcon />
            </button>
          </StyledMenuItem>
          <StyledMenuItem>
            <button onClick={this.props.handleOrganize}>
              Organize
              <MoveIcon />
            </button>
          </StyledMenuItem>
          <StyledMenuItem>
            <button onClick={this.props.handleArchive}>
              Archive
              <ArchiveIcon />
            </button>
          </StyledMenuItem>
        </ul>
      </StyledMenu>
    )
  }
}

CardMenu.propTypes = {
  cardId: PropTypes.number.isRequired,
  className: PropTypes.string,
  handleDuplicate: PropTypes.func.isRequired,
  handleLink: PropTypes.func.isRequired,
  handleOrganize: PropTypes.func.isRequired,
  handleArchive: PropTypes.func.isRequired,
}

CardMenu.defaultProps = {
  className: 'card-menu'
}

CardMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CardMenu
