import React, { Fragment } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import styled, { ThemeProvider } from 'styled-components'

import ArrowIcon from '~/ui/icons/ArrowIcon'
import BctButton from '~/ui/global/BctButton'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import CardMenuIcon from '~/ui/icons/CardMenuIcon'
import Checkbox from '~/ui/forms/Checkbox'
import CloseIcon from '~/ui/icons/CloseIcon'
import CornerPositioned from '~/ui/global/CornerPositioned'
import { Heading3 } from '~/ui/global/styled/typography'
import MenuIcon from '~/ui/icons/MenuIcon'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

export const StyledMenuButtonWrapper = styled.div`
  position: ${props => (props.hideDotMenu ? 'absolute' : 'relative')};
  ${props =>
    !props.menuOpen &&
    props.hideDotMenu &&
    `
    display: none;
  `}
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
    `}
    ${props =>
      props.theme.isMobileFullScreen &&
      `
      margin-top: 0;
      `}
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
  ${props =>
    props.theme.isMobileFullScreen &&
    `
    background-color: ${v.colors.commonLightest};
    border-top: 1px solid ${v.colors.commonMedium};
    bottom: 0;
    left: 0;
    height: auto;
    padding-top: 36px;
    position: fixed;
    width: 100vw;
    z-index: ${v.zIndex.aboveClickWrapper};
  `}
`

const CloseButton = styled.button`
  cursor: pointer;
  display: block;
  left: 14px;
  position: absolute;
  top: 12px;
  width: 12px;
  z-index: ${v.zIndex.gridCardTop};
`

const MobileHeaderBar = styled.div`
  align-items: center;
  background-color: ${v.colors.white};
  display: flex;
  height: 36px;
  justify-content: center;
  left: 0;
  position: absolute;
  text-align: center;
  top: 0px;
  width: 100%;

  ${Heading3} {
    margin-bottom: 0;
  }
`

export const StyledMenuWrapper = styled.div`
  display: ${props => (props.open ? 'block' : 'none')};
  position: ${props => {
    if (props.theme.isMobileFullScreen) return 'static'
    if (props.positionRelative) return 'relative'
    return 'absolute'
  }};
  padding: 10px;
  transition: left 120ms;
  z-index: ${v.zIndex.aboveClickWrapper};

  ${props =>
    props.theme.isMobileFullScreen &&
    `
    padding-bottom: 0;
    padding-left: 0;
    padding-right: 0;
    padding-top: 0;
  `}

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
  background-color: ${props =>
    props.theme.isMobileFullScreen ? v.colors.commonLightest : 'white'};
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.36);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  width: ${props => props.width}px;

  ${props =>
    props.theme.isMultiTieredMenu &&
    `
    box-shadow: none;
    overflow: visible !important;
  `}

  ${props =>
    props.theme.isMobileFullScreen &&
    `
    box-shadow: none;
    padding-bottom: 6px;
    width: 100%;

    ${StyledMenuItem} {
      padding-left: 0;
      width: 100%;
    }
  `}

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

const DefaultWrapper = styled.div`
  position: relative;
  z-index: ${v.zIndex.aboveClickWrapper};
`
export const StyledMenuButton = styled.button`
  cursor: ${props => (props.linkCursor ? 'pointer' : 'auto')};
  font-family: ${v.fonts.sans};
  font-weight: 400;
  font-size: 1rem;
  max-width: 280px;
  margin-top: -13px;
  margin-bottom: -13px;
  padding-left: ${props => props.nested * 10}px;
  text-align: left;
  text-transform: capitalize;
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
  width: ${props => props.width - 3 || 200}px;
  ${props => props.bgColor && `background-color: ${props.bgColor};`}
  border-top: solid
    ${props => (props.borderColor ? props.borderColor : v.colors.commonMedium)};
  border-top-width: ${props => (props.noBorder ? 0 : 1)}px;

  ${props =>
    props.theme.isMultiTieredMenu &&
    `
    overflow: visible;

    &:first-of-type {
      border-top-width: 0;
    }
  `}

  ${props =>
    props.theme.isMobileFullScreen &&
    `
    border-left-width: 0px;
    border-top: none;
    display: block;
    padding-bottom: 0;
    padding-left: 7px !important;
  `}

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
      vertical-align: middle;
      display: inline-block;
      padding-top: 4px;

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

const TieredMenuHeading = styled(Heading3)`
  ${props =>
    props.theme.isMobileFullScreen
      ? `
    border-bottom: 2px solid ${v.colors.black};
    font-weight: ${v.weights.medium};
    margin-left: 7px;
    padding-bottom: 8px;
    text-transform: uppercase;
  `
      : `
    font-size: 1rem;
    font-weight: ${v.weights.book};
    text-transform: none;
  `}

  .icon {
    bottom: 20px;
    height: 15px;
    right: 16px;
    position: absolute;
    width: 8px;
  }
`

class PopoutMenu extends React.Component {
  state = {
    openSubMenuName: null,
  }

  get isMobileFullScreen() {
    const { mobileFixedMenu } = this.props
    return uiStore.isTouchDevice && mobileFixedMenu
  }

  get isMultiTieredMenu() {
    const { menuItems } = this.props
    const { isMobileFullScreen } = this
    return (
      _.some(menuItems, item => item.subItems && !!item.subItems.length) &&
      !isMobileFullScreen
    )
  }

  get groupedMenuItems() {
    const { menuItems } = this.props
    let { groupedMenuItems } = this.props
    if (_.isEmpty(groupedMenuItems)) {
      // just put the menuItems into a group by default
      groupedMenuItems = { main: menuItems }
    }
    return groupedMenuItems
  }

  handleTierMouseover = (itemName, ev) => {
    this.setState({
      openSubMenuName: itemName,
    })
  }

  handleTierMouseLeave = ev => {
    this.setState({
      openSubMenuName: null,
    })
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

  renderMenuItem = (item, i) => {
    const { wrapperClassName, width, wrapText } = this.props
    const {
      id,
      name,
      component,
      iconLeft,
      iconRight,
      loading,
      withAvatar,
      bgColor,
      noBorder,
      borderColor,
      hasCheckbox,
      isChecked,
      subItems,
      noHover,
    } = item
    let { padding, onClick } = item
    const key = `${name}-${id || i}`
    if (component) {
      return (
        <StyledMenuItem
          key={key}
          noHover
          width={width - 25}
          padding="0 0 0 16px"
        >
          {component}
        </StyledMenuItem>
      )
    }

    if (!onClick) {
      onClick = null
    }

    let className = `menu-${_.kebabCase(name)}`
    const rightIconClassName = 'icon-right'
    if (withAvatar) className += ' with-avatar'
    if (subItems) padding = '16px 0 16px 16px'

    return (
      <StyledMenuItem
        key={key}
        borderColor={borderColor}
        noBorder={noBorder}
        noHover={noHover || !onClick}
        hasCheckbox={hasCheckbox}
        loading={loading}
        wrapperClassName={wrapperClassName}
        bgColor={bgColor}
        width={width - 20}
        padding={padding}
        onMouseEnter={subItems && (() => this.handleTierMouseover(item.name))}
        onMouseLeave={subItems && this.handleTierMouseLeave}
      >
        {subItems ? (
          <Fragment>
            <TieredMenuHeading upperCased={this.isMobileFullScreen} noSpacing>
              {item.name}{' '}
              {!this.isMobileFullScreen && <ArrowIcon rotation={0} />}
            </TieredMenuHeading>
            <StyledMenuWrapper
              open={
                this.state.openSubMenuName === item.name ||
                this.isMobileFullScreen
              }
              offsetPosition={{
                x: this.isMobileFullScreen ? 0 : 260,
                y: -11,
              }}
            >
              <StyledMenu width={width}>
                {subItems.map((subItem, i) => this.renderMenuItem(subItem, i))}
              </StyledMenu>
            </StyledMenuWrapper>
          </Fragment>
        ) : (
          <Fragment>
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
              linkCursor={!!onClick}
            >
              {iconLeft && <span className="icon-left">{iconLeft}</span>}
              {this.renderName(item)}
              {iconRight && (
                <span className={rightIconClassName}>{iconRight}</span>
              )}
            </StyledMenuButton>
          </Fragment>
        )}
      </StyledMenuItem>
    )
  }

  get renderMenuItems() {
    const { groupExtraComponent } = this.props
    const { groupedMenuItems } = this
    const rendered = []
    Object.keys(groupedMenuItems).forEach(groupName => {
      rendered.push(
        <div className={groupName} key={groupName}>
          {groupExtraComponent[groupName]}
          {groupedMenuItems[groupName].map((item, i) =>
            this.renderMenuItem(item, i)
          )}
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
      buttonStyle,
      className,
      disabled,
      hideDotMenu,
      menuOpen,
      mobileFixedMenu,
      onClick,
      onClose,
      offsetPosition,
      onMouseLeave,
      position,
      positionRelative,
      title,
      width,
      wrapperClassName,
    } = this.props
    const { isMultiTieredMenu, isMobileFullScreen } = this

    const isCard = buttonStyle === 'card'

    const MenuToggle = this.buttonStyleMenuToggle(buttonStyle)
    const icon = this.buttonStyleIcon(buttonStyle)
    const Wrapper = isMobileFullScreen ? CornerPositioned : DefaultWrapper

    return (
      <Wrapper>
        <ThemeProvider
          theme={{ mobileFixedMenu, isMobileFullScreen, isMultiTieredMenu }}
        >
          <StyledMenuButtonWrapper
            className={`${wrapperClassName} ${menuOpen && ' open'}`}
            menuOpen={menuOpen}
            role="presentation"
            onMouseLeave={onMouseLeave}
            hideDotMenu={hideDotMenu}
            mobileFixedMenu={mobileFixedMenu}
            multiTiered={this.isMultiTieredMenu}
          >
            {isMobileFullScreen && menuOpen && (
              <MobileHeaderBar>
                <CloseButton onClick={onClose}>
                  <CloseIcon />
                </CloseButton>
                <Heading3>{title}</Heading3>
              </MobileHeaderBar>
            )}
            {!hideDotMenu && (
              <MenuToggle
                disabled={disabled}
                onClick={onClick}
                size={isCard ? 28 : 14}
                className={`${className} menu-toggle`}
                data-cy={'PopoutMenu'}
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
        </ThemeProvider>
      </Wrapper>
    )
  }
}

const propTypeMenuItem = PropTypes.arrayOf(
  PropTypes.shape({
    bgColor: PropTypes.string,
    borderColor: PropTypes.string,
    hasCheckbox: PropTypes.bool,
    iconLeft: PropTypes.element,
    iconRight: PropTypes.element,
    isChecked: PropTypes.bool,
    loading: PropTypes.bool,
    name: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    noBorder: PropTypes.bool,
    noHover: PropTypes.bool,
    onClick: PropTypes.func,
    subItems: PropTypes.arrayOf(PropTypes.object),
    component: PropTypes.object,
    TextComponent: PropTypes.object,
    withAvatar: PropTypes.bool,
  })
)

PopoutMenu.propTypes = {
  /** Controls the size of the dotdot menu and generally how it renders */
  buttonStyle: PropTypes.string,
  className: PropTypes.string,
  /** Disables the dot menu, meaning it won't open the menu on click */
  disabled: PropTypes.bool,
  /** The dot menu is used for the action menu and opens the popout menu */
  hideDotMenu: PropTypes.bool,
  /** The component passed in will be rendered before the grouped items. Use this
   * if you need to render something special before all the grouped items. */
  groupExtraComponent: PropTypes.shape({
    component: PropTypes.node,
  }),
  /** Allows you to group the menu items over different sections for top, bottom
   * and the special organizations use case.
   * Need one or the other between menuItems / groupedMenuItems */
  groupedMenuItems: PropTypes.shape({
    top: propTypeMenuItem,
    organizations: propTypeMenuItem,
    bottom: propTypeMenuItem,
  }),
  /** Use this prop to control yourself when the menu should be open, required
   * if you are not rendering the dot dot dot menu */
  menuOpen: PropTypes.bool,
  /** Need one or the other between menuItems / groupedMenuItems */
  menuItems: propTypeMenuItem,
  /** Configures the menu to open fixed to the bottom half of screen on mobile */
  mobileFixedMenu: PropTypes.bool,
  /** Controls where to position the menu compared to where it currently is. Use
   * this to push the menu to the left or right of where it should open from */
  offsetPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  onClick: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClose: PropTypes.func,
  /** Used to completely reposition the whole menu */
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  positionRelative: PropTypes.bool,
  /** A title for the popout, will only display on the mobile fullscreen UI */
  title: PropTypes.string,
  width: PropTypes.number,
  /** If the value is 'card-menu' it applies extra right margin. If the value
   * is 'add-audience-menu' it will apply special positioning to the right
   * icon. Any value will also be passed to the element's `class` attribute on
   * the menu button wrapper, which could be used for styling or targeting in
   * tests. */
  wrapperClassName: PropTypes.string,
  wrapText: PropTypes.bool,
}

PopoutMenu.defaultProps = {
  buttonStyle: '',
  className: '',
  disabled: false,
  groupedMenuItems: {},
  groupExtraComponent: {},
  hideDotMenu: false,
  // you need one or the other between menuItems / groupedMenuItems
  menuItems: [],
  menuOpen: false,
  mobileFixedMenu: false,
  onMouseLeave: () => null,
  onClose: () => null,
  onClick: () => null,
  position: null,
  offsetPosition: null,
  positionRelative: true,
  title: null,
  width: 200,
  wrapperClassName: 'card-menu',
  wrapText: false,
}

export default PopoutMenu
