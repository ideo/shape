import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import CardMenuIcon from '~/ui/icons/CardMenuIcon'
import MenuIcon from '~/ui/icons/MenuIcon'
import { Checkbox } from '~/ui/global/styled/forms'
import { BctButton } from '~/ui/grid/shared'
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
  position: absolute;
  padding: 10px;
  transition: left 120ms;
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
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.36);
  ${props =>
    props.limitMaxHeight &&
    `
    max-height: ${window.innerHeight - 260}px;
  `}
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  width: ${props => props.width}px;
`
StyledMenu.defaultProps = {
  limitMaxHeight: true,
}

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
  max-width: 240px;
  padding-left: ${props => props.nested * 10}px;
  margin-top: -13px;
  margin-bottom: -13px;
  width: 100%;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const StyledMenuItem = styled.li`
  border-bottom: solid ${v.colors.commonMedium};
  border-bottom-width: ${props => (props.noBorder ? 0 : 1)}px;
  border-left: 7px solid transparent;
  color: ${v.colors.black};
  display: flex;
  min-height: 1rem;
  padding: 0.75rem 0 0.75rem 1rem;
  position: relative;
  width: 100%;
  width: ${props => props.width || 200}px;

  ${StyledMenuButton} {
    opacity: ${props => (props.loading ? 0.5 : 1)};
    border-left: 7px solid transparent;
    font-family: ${v.fonts.sans};
    font-weight: 400;
    font-size: 1rem;
    text-align: left;
    border-top: solid
      ${props =>
        props.borderColor ? props.borderColor : v.colors.commonMedium};
    border-top-width: ${props => (props.noBorder ? 0 : 1)}px;
    color: ${v.colors.black};
    ${props => props.bgColor && `background-color: ${props.bgColor};`}

    &.with-avatar {
      padding-left: 3.75rem;
      padding-right: 1rem;
    }

    .icon-left {
      margin-right: ${props => {
        if (props.hasCheckbox) {
          return 30
        } else if (props.wrapperClassName === 'card-menu') {
          return 16
        } else {
          return 0
        }
      }}px;
    }

    .icon-left .icon {
      left: ${props => {
        if (props.hasCheckbox) {
          return 35
        } else if (props.wrapperClassName === 'card-menu') {
          return 8
        } else {
          return 0
        }
      }}px;
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
  }
  &:hover,
  &:active {
    ${StyledMenuButton} {
      ${props =>
        !props.hasCheckbox &&
        !props.noHover &&
        `border-left-color: ${v.colors.black};`}
    }
  }
`
StyledMenuItem.displayName = 'StyledMenuItem'

const StyledMenuItemText = styled.span`
  line-height: 1.4rem;
`

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
    const { groupExtraComponent, wrapperClassName, width } = this.props
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
              TextComponent,
              noHover,
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
              >
                <StyledMenuButton
                  onClick={loading ? () => null : onClick}
                  data-cy={`PopoutMenu_${_.camelCase(name)}`}
                  className={className}
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
                  {iconLeft && <span className="icon-left">{iconLeft}</span>}
                  <StyledMenuItemText>
                    {TextComponent ? (
                      <TextComponent>{name}</TextComponent>
                    ) : (
                      name
                    )}
                  </StyledMenuItemText>

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
      location,
      limitMaxHeight,
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
          <StyledMenu limitMaxHeight={limitMaxHeight} width={width}>
            {this.renderMenuItems}
          </StyledMenu>
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
  limitMaxHeight: PropTypes.bool,
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
  limitMaxHeight: true,
}

export default PopoutMenu
