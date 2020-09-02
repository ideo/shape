import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import BctButton from '~/ui/global/BctButton'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import CardMenuIcon from '~/ui/icons/CardMenuIcon'
import Checkbox from '~/ui/forms/Checkbox'
import MenuIcon from '~/ui/icons/MenuIcon'
import v from '~/utils/variables'

export const StyledMenuButtonWrapper = styled.div`
  position: ${props => (props.hideDotMenu ? 'absolute' : 'relative')};
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
  position: ${props => (props.positionRelative ? 'relative' : 'absolute')};
  padding: 10px;
  transition: left 120ms;
  z-index: ${v.zIndex.aboveClickWrapper};
  ${props => {
    const { position, offsetPosition } = props
    if (position && offsetPosition) {
      const { x, y } = position
      if (x === 0 && y === 0 && !props.positionRelative) {
        const { x: offsetX } = offsetPosition

        // positioning was overriden see: actionMenu::offsetPosition
        if (offsetX === 0) {
          return `
            top: 22px;
          `
        }

        return `
            top: 22px;
            right: -10px;
          `
      }
      // dynamic positioning based on component dimensions, click position relative to the screen, see: clickUtils::calculatePopoutMenuOffset
      const { x: offsetX, y: offsetY } = offsetPosition
      const transformX = x - offsetX
      const transformY = y + offsetY

      return `
        left: ${transformX}px;
        top: ${transformY}px;
      `
    }

    // dynamic positioning based on component dimensions, click position relative to the parent component, see: clickUtils::calculatePopoutMenuOffset
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
    // ie: org menu, breadcrum, bctmenu
    return defaultFixedPosition
  }}}
`
StyledMenuWrapper.displayName = 'StyledMenuWrapper'

export const StyledMenu = styled.ul`
  background-color: white;
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.36);
  max-height: ${window.innerHeight - 260}px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  width: ${props => props.width}px;
  .organizations {
    border-top: 1px solid ${v.colors.commonMedium};
    li {
      ${StyledMenuItem} {
        padding-top: 20px;
      }
    }
  }
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

export const StyledMenuButton = styled.button`
  text-transform: capitalize;
  font-family: ${v.fonts.sans};
  font-weight: 400;
  font-size: 1rem;
  text-align: left;
  max-width: 280px;
  padding-left: ${props => props.nested * 10}px;
  margin-top: -13px;
  margin-bottom: -13px;
  width: 100%;
  ${props =>
    props.wrapText
      ? `display: flex;
        align-items: center;`
      : `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
`

export const StyledMenuItem = styled.li`
  border-left: 7px solid transparent;
  color: ${v.colors.black};
  display: flex;
  min-height: 1rem;
  overflow-y: hidden;
  padding: ${props => props.padding};
  position: relative;
  width: ${props => props.width || 200}px;
  ${props => props.bgColor && `background-color: ${props.bgColor};`}
  border-top: solid
    ${props => (props.borderColor ? props.borderColor : v.colors.commonMedium)};
  border-top-width: ${props => (props.noBorder ? 0 : 1)}px;

  ${StyledMenuButton} {
    opacity: ${props => (props.loading ? 0.5 : 1)};
    border-left: 0;
    font-family: ${v.fonts.sans};
    font-weight: 400;
    font-size: 1rem;
    text-align: left;
    color: ${v.colors.black};

    &.with-avatar {
      padding-left: 1.4rem;
      padding-right: 1rem;
    }

    .icon-left {
      margin-right: ${props => {
        if (props.hasCheckbox) {
          return 10
        } else if (props.wrapperClassName === 'card-menu') {
          return 16
        } else {
          return 0
        }
      }}px;
      margin-left: ${props => {
        if (props.hasCheckbox) {
          return 0
        } else {
          return -5
        }
      }}px;
    }

    .icon {
      width: 16px;
      height: 16px;
      line-height: 1.4rem;
    }
    .icon-right .icon {
      top: 50%;
      transform: translateY(-50%);
      position: absolute;
      left: auto;
      right: ${props =>
        props.wrapperClassName === 'add-audience-menu' ? 0.5 : 1.5}rem;
    }
    .icon-left .icon {
      display: inline-block;
      margin-left: ${props => {
        if (props.hasCheckbox) {
          return 10
        } else if (props.wrapperClassName === 'card-menu') {
          return 8
        } else {
          return 0
        }
      }}px;
    }
  }
  &:hover,
  &:active {
    ${props =>
      !props.hasCheckbox &&
      !props.noHover &&
      `border-left-color: ${v.colors.black};`}
  }
`
StyledMenuItem.displayName = 'StyledMenuItem'
StyledMenuItem.propTypes = {
  padding: PropTypes.string,
}

StyledMenuItem.defaultProps = {
  padding: '18px 0 18px 16px',
}

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

  renderName(item) {
    const { wrapText } = this.props
    const { name, TextComponent } = item
    const menuItem = (
      <span>
        {TextComponent ? <TextComponent>{name}</TextComponent> : name}
      </span>
    )
    if (!wrapText) return menuItem

    return <div style={{ display: 'inline-block' }}>{menuItem}</div>
  }

  get renderMenuItems() {
    const {
      groupExtraComponent,
      wrapperClassName,
      width,
      wrapText,
    } = this.props
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
              borderColor,
              hasCheckbox,
              isChecked,
              noHover,
              padding,
            } = item
            let className = `menu-${_.kebabCase(name)}`
            const rightIconClassName = 'icon-right'
            if (withAvatar) className += ' with-avatar'
            return (
              <StyledMenuItem
                key={`${name}-${id || i}`}
                borderColor={borderColor}
                noBorder={noBorder}
                noHover={noHover}
                hasCheckbox={hasCheckbox}
                loading={loading}
                wrapperClassName={wrapperClassName}
                bgColor={bgColor}
                width={width - 20}
                padding={padding}
              >
                {hasCheckbox && (
                  <Checkbox
                    style={{
                      marginRight: '0px',
                      marginLeft: '-14px',
                      width: 'auto',
                      height: 'auto',
                    }}
                    color="primary"
                    checked={isChecked}
                    onChange={loading ? () => null : onClick}
                    value="yes"
                    size="small"
                    className="checkBox"
                  />
                )}
                <StyledMenuButton
                  onClick={loading ? () => null : onClick}
                  data-cy={`PopoutMenu_${_.camelCase(name)}`}
                  className={className}
                  wrapText={wrapText}
                >
                  {iconLeft && <span className="icon-left">{iconLeft}</span>}
                  {this.renderName(item)}
                  {iconRight && (
                    <span className={rightIconClassName}>{iconRight}</span>
                  )}
                </StyledMenuButton>
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
      positionRelative,
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
          positionRelative={positionRelative}
          position={position}
          offsetPosition={offsetPosition}
          height={200}
          className="menu-wrapper"
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
    borderColor: PropTypes.string,
    noHover: PropTypes.bool,
    loading: PropTypes.bool,
    withAvatar: PropTypes.bool,
    bgColor: PropTypes.string,
    TextComponent: PropTypes.object,
    hasCheckbox: PropTypes.bool,
    isChecked: PropTypes.bool,
  })
)

PopoutMenu.propTypes = {
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
  /** If the value is 'card-menu' it applies extra right margin. If the value
   * is 'add-audience-menu' it will apply special positioning to the right
   * icon. Any value will also be passed to the element's `class` attribute on
   * the menu button wrapper, which could be used for styling or targeting in
   * tests. */
  wrapperClassName: PropTypes.string,
  width: PropTypes.number,
  /** Use this prop to control yourself when the menu should be open, required
   * if you are not rendering the dot dot dot menu */
  menuOpen: PropTypes.bool,
  /** Disables the dot menu, meaning it won't open the menu on click */
  disabled: PropTypes.bool,
  /** Controls the size of the dotdot menu and generally how it renders */
  buttonStyle: PropTypes.string,
  /** Need one or the other between menuItems / groupedMenuItems */
  menuItems: propTypeMenuItem,
  /** The dot menu is used for the action menu and opens the popout menu */
  hideDotMenu: PropTypes.bool,
  /** Used to completely reposition the whole menu */
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  /** Controls where to position the menu compared to where it currently is. Use
   * this to push the menu to the left or right of where it should open from */
  offsetPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  /** Allows you to group the menu items over different sections for top, bottom
   * and the special organizations use case.
   * Need one or the other between menuItems / groupedMenuItems */
  groupedMenuItems: PropTypes.shape({
    top: propTypeMenuItem,
    organizations: propTypeMenuItem,
    bottom: propTypeMenuItem,
  }),
  /** The component passed in will be rendered before the grouped items. Use this
   * if you need to render something special before all the grouped items. */
  groupExtraComponent: PropTypes.shape({
    component: PropTypes.node,
  }),
  positionRelative: PropTypes.bool,
  wrapText: PropTypes.bool,
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
  positionRelative: true,
  wrapText: false,
}

export default PopoutMenu
