import PropTypes from 'prop-types'
import styled from 'styled-components'

import MenuIcon from '~/ui/icons/MenuIcon'
import v from '~/utils/variables'

export const StyledMenuButtonWrapper = styled.div`
  position: relative;
  .menu-wrapper {
    display: none;
    opacity: 0;
  }
  &.open .menu-wrapper {
    display: block;
    opacity: 1;
    animation: fadeInFromNone 0.25s;
  }
  @keyframes fadeInFromNone {
    0% {
      display: none;
      opacity: 0;
    }

    0.1% {
      display: block;
      opacity: 0;
    }

    100% {
      display: block;
      opacity: 1;
    }
  }
`

export const StyledMenuWrapper = styled.div`
  position: absolute;
  padding: 10px;
  top: 14px;
  right: -32px;
`
StyledMenuWrapper.displayName = 'StyledMenuWrapper'

export const StyledMenu = styled.ul`
  background-color: white;
  width: ${props => props.width}px;
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
    font-family: ${v.fonts.sans};
    font-weight: 300;
    font-size: 0.8rem;
    text-align: left;
    border-bottom: solid ${v.colors.gray};
    border-bottom-width: ${props => (props.noBorder ? 0 : 1)}px;
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
StyledMenuItem.displayName = 'StyledMenuItem'

class PopoutMenu extends React.PureComponent {
  get renderMenuItems() {
    return this.props.menuItems.map(item => {
      const { name, iconLeft, iconRight, onClick } = item
      return (
        <StyledMenuItem key={name} noBorder={item.noBorder}>
          <button
            onClick={onClick}
            className={`menu-${name.toLowerCase()}`}
          >
            {iconLeft}
            {name}
            {iconRight}
          </button>
        </StyledMenuItem>
      )
    })
  }

  render() {
    const {
      className,
      menuOpen,
      onMouseLeave,
      onClick,
      width,
    } = this.props
    return (
      <StyledMenuButtonWrapper
        className={`${className} ${menuOpen && ' open'}`}
        role="presentation"
        onMouseLeave={onMouseLeave}
      >
        <StyledMenuToggle
          onClick={onClick}
          className="menu-toggle"
        >
          <MenuIcon />
        </StyledMenuToggle>
        <StyledMenuWrapper className="menu-wrapper">
          <StyledMenu width={width}>
            {this.renderMenuItems}
          </StyledMenu>
        </StyledMenuWrapper>
      </StyledMenuButtonWrapper>
    )
  }
}

PopoutMenu.propTypes = {
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
  width: PropTypes.number,
  menuOpen: PropTypes.bool,
  menuItems: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    iconLeft: PropTypes.element,
    iconRight: PropTypes.element,
    onClick: PropTypes.func,
    noBorder: PropTypes.bool,
  })).isRequired,
}

PopoutMenu.defaultProps = {
  onMouseLeave: () => null,
  onClick: () => null,
  className: '',
  menuOpen: false,
  width: 200,
}

export default PopoutMenu
