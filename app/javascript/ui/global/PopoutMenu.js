import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import CardMenuIcon from '~/ui/icons/CardMenuIcon'
import MenuIcon from '~/ui/icons/MenuIcon'
import { BctButton } from '~/ui/grid/shared'
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
    ${props =>
      props.hideDotMenu &&
      `
      margin-top: 25px;
    `};
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
  z-index: ${v.zIndex.aboveClickWrapper};
  ${props => {
    const { position, offsetPosition, location } = props
    // dynamic positioning based on component dimensions, click position relative to the screen
    if (position && offsetPosition) {
      const { x, y } = position
      const clickedOnGridCardDotMenu =
        location && (location === 'GridCard' || location === 'Search')
      if (x === 0 && y === 0 && clickedOnGridCardDotMenu) {
        // any transformation that's based on click must be calculated via `clickUtils::calculatePopoutMenuOffset`
        // this is a manual override for popout menu to appear in the lower left during GridCard dot menu click
        return `
          top: 22px;
          right: -10px;
        `
      }
      const { x: offsetX, y: offsetY } = offsetPosition
      const transformX = x - offsetX
      const transformY = y + offsetY

      return `
        left: ${transformX}px;
        top: ${transformY}px;
      `
    }

    // dynamic positioning based on component dimensions, click position relative to the parent component
    if (offsetPosition) {
      const { x: offsetX, y: offsetY } = offsetPosition
      return `
        left: ${offsetX}px;
        top: ${offsetY}px;
      `
    }

    const defaultFixedPosition = `
      right: -10px;
    `
    // fallback default position for all other menus that don't use dynamic positioning
    // ie: org menu, and bctmenu
    return defaultFixedPosition
  }}}
`
StyledMenuWrapper.displayName = 'StyledMenuWrapper'

export const StyledMenu = styled.ul`
  background-color: white;
  width: ${props => props.width}px;
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.36);
`

export const StyledMenuToggle = styled.button`
  padding: 2px 7px;
  .icon {
    width: ${props => props.size}px;
    height: ${props => props.size}px;
  }
`
StyledMenuToggle.defaultTypes = {
  size: 14,
}

StyledMenuToggle.displayName = 'StyledMenuToggle'

export const StyledMenuItem = styled.li`
  button {
    width: 100%;
    min-height: 2rem;
    padding: 0.75rem 0 0.75rem 1rem;
    text-transform: capitalize;
    position: relative;
    opacity: ${props => (props.loading ? 0.5 : 1)};
    border-left: 7px solid transparent;
    font-family: ${v.fonts.sans};
    font-weight: 400;
    font-size: 1rem;
    text-align: left;
    border-bottom: solid ${v.colors.commonMedium};
    border-bottom-width: ${props => (props.noBorder ? 0 : 1)}px;
    color: ${v.colors.black};
    ${props => props.bgColor && `background-color: ${props.bgColor};`}
    &.with-avatar {
      padding-left: 3.75rem;
      padding-right: 1rem;
    }

    .icon-left {
      margin-right: ${props =>
        props.wrapperClassName === 'card-menu' ? 16 : 0}px;
    }

    .icon-left .icon {
      left: ${props => (props.wrapperClassName === 'card-menu' ? 8 : 0)}px;
    }

    .icon {
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      position: absolute;
      width: 16px;
      height: 16px;
      line-height: 1.4rem;
    }
    .icon-right .icon {
      left: auto;
      right: ${props =>
        props.wrapperClassName === 'add-audience-menu' ? -0.5 : 1.5}rem;
    }
    span {
      line-height: 1.4rem;
    }
  }
  &:hover,
  &:active {
    button {
      border-left: 7px solid ${v.colors.black};
    }
  }
`
StyledMenuItem.displayName = 'StyledMenuItem'

class PopoutMenu extends React.Component {
  get groupedMenuItems() {
    const { menuItems } = this.props
    let { groupedMenuItems } = this.props
    if (_.isEmpty(groupedMenuItems)) {
      // just put the menuItems into a group by default
      groupedMenuItems = { main: menuItems }
    }
    return groupedMenuItems
  }

  get renderMenuItems() {
    const { groupExtraComponent, wrapperClassName } = this.props
    const { groupedMenuItems } = this
    const rendered = []
    Object.keys(groupedMenuItems).forEach(groupName => {
      rendered.push(
        <div className={groupName} key={groupName}>
          {groupExtraComponent[groupName]}
          {groupedMenuItems[groupName].map((item, i) => {
            const {
              id,
              name,
              iconLeft,
              iconRight,
              onClick,
              loading,
              withAvatar,
              bgColor,
              noBorder,
            } = item
            let className = `menu-${_.kebabCase(name)}`
            const rightIconClassName = 'icon-right'
            if (withAvatar) className += ' with-avatar'

            return (
              <StyledMenuItem
                key={`${name}-${id || i}`}
                noBorder={noBorder}
                loading={loading}
                wrapperClassName={wrapperClassName}
                bgColor={bgColor}
              >
                <button
                  onClick={loading ? () => null : onClick}
                  data-cy={`PopoutMenu_${_.camelCase(name)}`}
                  className={className}
                >
                  {iconLeft && <span className="icon-left">{iconLeft}</span>}
                  <span>{name}</span>
                  {iconRight && (
                    <span className={rightIconClassName}>{iconRight}</span>
                  )}
                </button>
              </StyledMenuItem>
            )
          })}
        </div>
      )
    })
    return rendered
  }

  buttonStyleIcon = buttonStyle => {
    switch (buttonStyle) {
      case 'bct':
        return <MenuIcon viewBox="-11 -11 26 40" />
      case 'card':
        return (
          <CardActionHolder>
            <CardMenuIcon />
          </CardActionHolder>
        )
      default:
        return <MenuIcon viewBox="0 0 5 18" />
    }
  }

  buttonStyleMenuToggle = buttonStyle => {
    switch (buttonStyle) {
      case 'bct':
        return BctButton
      default:
        return StyledMenuToggle
    }
  }

  render() {
    const {
      className,
      wrapperClassName,
      menuOpen,
      disabled,
      onMouseLeave,
      onClick,
      width,
      buttonStyle,
      position,
      offsetPosition,
      hideDotMenu,
      location,
    } = this.props

    const isBct = buttonStyle === 'bct'
    const isCard = buttonStyle === 'card'

    const MenuToggle = this.buttonStyleMenuToggle(buttonStyle)
    const icon = this.buttonStyleIcon(buttonStyle)
    return (
      <StyledMenuButtonWrapper
        className={`${wrapperClassName} ${menuOpen && ' open'}`}
        role="presentation"
        onMouseLeave={onMouseLeave}
        hideDotMenu={hideDotMenu}
      >
        {!hideDotMenu && (
          <MenuToggle
            disabled={disabled}
            onClick={onClick}
            size={isCard ? 28 : 14}
            className={`${className} menu-toggle`}
            data-cy={isBct ? 'BctButton-more' : 'PopoutMenu'}
          >
            {icon}
          </MenuToggle>
        )}
        <StyledMenuWrapper
          position={position}
          offsetPosition={offsetPosition}
          height={200}
          className="menu-wrapper"
          location={location}
          menuClass={className}
        >
          <StyledMenu width={width}>{this.renderMenuItems}</StyledMenu>
        </StyledMenuWrapper>
      </StyledMenuButtonWrapper>
    )
  }
}

const propTypeMenuItem = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    iconLeft: PropTypes.element,
    iconRight: PropTypes.element,
    onClick: PropTypes.func,
    noBorder: PropTypes.bool,
    loading: PropTypes.bool,
    withAvatar: PropTypes.bool,
    bgColor: PropTypes.string,
  })
)

PopoutMenu.propTypes = {
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  width: PropTypes.number,
  menuOpen: PropTypes.bool,
  disabled: PropTypes.bool,
  buttonStyle: PropTypes.string,
  menuItems: propTypeMenuItem,
  hideDotMenu: PropTypes.bool,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  offsetPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  groupedMenuItems: PropTypes.shape({
    top: propTypeMenuItem,
    organizations: propTypeMenuItem,
    bottom: propTypeMenuItem,
  }),
  groupExtraComponent: PropTypes.shape({
    component: PropTypes.node,
  }),
  location: PropTypes.string,
}

PopoutMenu.defaultProps = {
  onMouseLeave: () => null,
  onClick: () => null,
  // you need one or the other between menuItems / groupedMenuItems
  menuItems: [],
  groupedMenuItems: {},
  className: '',
  wrapperClassName: 'card-menu',
  menuOpen: false,
  position: null,
  offsetPosition: null,
  disabled: false,
  buttonStyle: '',
  width: 200,
  groupExtraComponent: {},
  hideDotMenu: false,
  location: null,
}

export default PopoutMenu
