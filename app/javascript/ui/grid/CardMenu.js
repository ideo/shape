import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, propTypes as MobxPropTypes } from 'mobx-react'

import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import ShareIcon from '~/ui/icons/ShareIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import MenuIcon from '~/ui/icons/MenuIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import v from '~/utils/variables'

export const StyledMenuButtonWrapper = styled.div`
  position: relative;
  .menu-wrapper {
    display: none;
  }
  &.open .menu-wrapper {
    display: block;
  }
`

export const StyledMenuWrapper = styled.div`
  position: absolute;
  padding: 10px;
  top: 14px;
  left: -6px;
`
StyledMenuWrapper.displayName = 'StyledMenuWrapper'

export const StyledMenu = styled.ul`
  background-color: #FFFFFF;
  width: 200px;
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.36);
`

export const StyledMenuToggle = styled.button`
  padding: 0 5px;
  .icon {
    width: 16px;
    height: 16px;
  }
`
StyledMenuToggle.displayName = 'StyledMenuToggle'

export const StyledMenuItem = styled.li`
  button {
    width: 100%;
    padding-left: 1rem;
    line-height: 2.5rem;
    text-transform: uppercase;
    position: relative;
    border-left: 7px solid transparent;
    font-family: 'Gotham';
    font-weight: 300;
    font-size: 0.8rem;
    text-align: left;
    border-bottom: 1px solid ${v.colors.gray};
    color: ${v.colors.blackLava};
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
      border-left: 7px solid ${v.colors.blackLava};
    }
  }
`

@inject('uiStore')
class CardMenu extends React.PureComponent {
  state = {
    open: false,
  }

  get cardId() {
    return this.props.cardId
  }

  setOpen = (open, closeOthers = true) => {
    this.setState({
      open: open,
    })

    if (open && closeOthers) {
      // Close any other open menus
      this.props.uiStore.cardMenuOpened(this)
    }
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
      <StyledMenuButtonWrapper
        className={css}
        role="presentation"
        onMouseLeave={this.handleMouseLeave}
      >
        <StyledMenuToggle onClick={this.toggleOpen}>
          <MenuIcon />
        </StyledMenuToggle>
        <StyledMenuWrapper className="menu-wrapper">
          <StyledMenu>
            <StyledMenuItem>
              <button
                onClick={this.props.handleShare}
                className="menu-share"
              >
                Share
                <ShareIcon />
              </button>
            </StyledMenuItem>
            <StyledMenuItem>
              <button
                onClick={this.props.handleDuplicate}
                className="menu-duplicate"
              >
                Duplicate
                <DuplicateIcon />
              </button>
            </StyledMenuItem>
            <StyledMenuItem>
              <button
                onClick={this.props.handleLink}
                className="menu-link"
              >
                Link
                <LinkIcon />
              </button>
            </StyledMenuItem>
            <StyledMenuItem>
              <button
                onClick={this.props.handleOrganize}
                className="menu-organize"
              >
                Organize
                <MoveIcon />
              </button>
            </StyledMenuItem>
            <StyledMenuItem>
              <button
                onClick={this.props.handleArchive}
                className="menu-archive"
              >
                Archive
                <ArchiveIcon />
              </button>
            </StyledMenuItem>
          </StyledMenu>
        </StyledMenuWrapper>
      </StyledMenuButtonWrapper>
    )
  }
}

CardMenu.propTypes = {
  cardId: PropTypes.number.isRequired,
  className: PropTypes.string,
  handleShare: PropTypes.func.isRequired,
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
