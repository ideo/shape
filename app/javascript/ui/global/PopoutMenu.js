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
    if (props.position) {
      let adjustLeft = 250
      if (props.direction === 'right') {
        adjustLeft = 50
      }
      return `
      position: absolute;
      left: ${props.position.x - adjustLeft + 32}px;
      top: ${props.position.y + 10}px;
      `
    }
    return ''
  }} ${props =>
    !props.position &&
    (props.direction === 'right' ? 'left: 0; top: 42px;' : 'right: -32px;')};
`
StyledMenuWrapper.displayName = 'StyledMenuWrapper'

export const StyledMenu = styled.ul`
  background-color: white;
  width: ${props => props.width}px;
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.36);
`

export const StyledMenuToggle = styled.button`
  margin-left: 7px;
  margin-right: 7px;
  padding: 2px 5px 0 0;
  padding-bottom: 2px;
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
    padding-left: 1rem;
    line-height: 2.5rem;
    text-transform: uppercase;
    position: relative;
    opacity: ${props => (props.loading ? 0.5 : 1)};
    border-left: 7px solid transparent;
    font-family: ${v.fonts.sans};
    font-weight: 300;
    font-size: 0.8rem;
    text-align: left;
    border-bottom: solid ${v.colors.commonMedium};
    border-bottom-width: ${props => (props.noBorder ? 0 : 1)}px;
    color: ${v.colors.black};
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
    const { groupExtraComponent } = this.props
    const { groupedMenuItems } = this
    const rendered = []
    Object.keys(groupedMenuItems).forEach(groupName => {
      rendered.push(
        <div className={groupName} key={groupName}>
          {groupExtraComponent[groupName]}
          {groupedMenuItems[groupName].map((item, i) => {
            const { id, name, iconLeft, iconRight, onClick, loading } = item
            return (
              <StyledMenuItem
                key={`${name}-${id || ''}`}
                noBorder={item.noBorder}
                loading={loading}
              >
                <button
                  onClick={loading ? () => null : onClick}
                  className={`menu-${name}`}
                >
                  {iconLeft}
                  {name}
                  {iconRight}
                </button>
              </StyledMenuItem>
            )
          })}
        </div>
      )
    })
    return rendered
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
      direction,
      position,
      hideDotMenu,
    } = this.props

    const isBct = buttonStyle === 'bct'
    const isCard = buttonStyle === 'card'
    const MenuToggle = isBct ? BctButton : StyledMenuToggle
    let icon = <MenuIcon viewBox="0 0 5 18" />
    if (isBct) icon = <MenuIcon viewBox="-11 -11 26 40" />
    if (isCard)
      icon = (
        <CardActionHolder>
          <CardMenuIcon />
        </CardActionHolder>
      )
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
          >
            {icon}
          </MenuToggle>
        )}
        <StyledMenuWrapper
          direction={direction}
          position={position}
          height={200}
          className="menu-wrapper"
        >
          <StyledMenu width={width}>{this.renderMenuItems}</StyledMenu>
        </StyledMenuWrapper>
      </StyledMenuButtonWrapper>
    )
  }
}

const propTypeMenuItem = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string,
    iconLeft: PropTypes.element,
    iconRight: PropTypes.element,
    onClick: PropTypes.func,
    noBorder: PropTypes.bool,
    loading: PropTypes.bool,
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
  groupedMenuItems: PropTypes.shape({
    top: propTypeMenuItem,
    organizations: propTypeMenuItem,
    bottom: propTypeMenuItem,
  }),
  groupExtraComponent: PropTypes.shape({
    component: PropTypes.node,
  }),
  direction: PropTypes.string,
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
  disabled: false,
  buttonStyle: '',
  width: 200,
  groupExtraComponent: {},
  direction: 'left',
  hideDotMenu: false,
}

export default PopoutMenu
