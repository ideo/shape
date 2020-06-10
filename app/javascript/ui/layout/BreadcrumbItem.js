import React, { Fragment } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import BreadcrumbCaretIcon from '~/ui/icons/BreadcrumbCaretIcon'
import LinkIconSm from '~/ui/icons/LinkIconSm'
import NestedArrowIcon from '~/ui/icons/NestedArrowIcon'
import NestedLineIcon from '~/ui/icons/NestedLineIcon'
import {
  StyledMenu,
  StyledMenuButton,
  StyledMenuItem,
  StyledMenuWrapper,
} from '~/ui/global/PopoutMenu'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const StyledBreadcrumbCaret = styled.div`
  display: inline-block;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  top: 0px;
  position: relative;
  vertical-align: top;
`

const StyledBreadcrumbItem = styled.div`
  display: inline-block;
  text-decoration: underline;
  ${({ backgroundColor }) =>
    backgroundColor &&
    `
    background: ${backgroundColor};
  `};
  a {
    color: ${props => (props.isLast ? v.colors.black : v.colors.commonDark)};
    text-decoration: none;
    display: inline-block;
    transition: ${v.transition};
    &:hover {
      cursor: pointer;
      color: ${v.colors.primaryDarkest};
    }
  }
`
StyledBreadcrumbItem.displayName = 'StyledBreadcrumbItem'
StyledBreadcrumbItem.defaultProps = {
  backgroundColor: 'white',
}

const StyledRestoreButton = styled.button`
  height: 15px;
  width: 15px;
  margin-right: 5px;
  display: inline-block;
  position: relative;
  top: 1px;
  background-color: ${v.colors.primaryMediumDark};
  color: ${v.colors.white};
  border-radius: 50%;
`
StyledRestoreButton.displayName = 'StyledRestoreButton'

const DiveButton = styled.button`
  height: 40px;
  margin-bottom: -10px;
  margin-left: auto;
  margin-right: 0;
  margin-top: -10px;
  width: 35px;
  transform: translate(0, 1px);

  position: absolute;
  right: 0;

  .icon {
    height: 16px;
    width: 16px;
  }
`
DiveButton.displayName = 'DiveButton'

const NestedArrowHolder = styled.div`
  color: ${v.colors.commonDark};
  display: inline-block;
  margin-left: 0px;
  margin-right: 5px;
  transform: translate(0, -3px);

  .icon.icon {
    transform: none;
    position: static;
    height: 15px;
    vertical-align: text-bottom;
    width: 10px;
  }
`
NestedArrowHolder.displayName = 'NestedArrowHolder'

const NestedLineHolder = styled.div`
  display: inline-block;
  margin-right: 2px;
  transform: translate(0, -2px);
  width: 3px;

  .icon.icon {
    transform: none;
    position: static;
    width: 1px;
    vertical-align: top;
    height: 12px;
  }
`
NestedLineHolder.displayName = 'NestedLineHolder'

const NEST_AMOUNT_Y_PX = 45
const MENU_WIDTH = 250
const HOVER_TIMEOUT_MS = 300

export class BreadcrumbItem extends React.Component {
  state = {
    baseDropDownRecords: [],
    dropdownOpen: false,
    menuItemOpenId: null,
    nestedMenuLoading: false,
    hoverTimer: null,
  }
  nestedMenuTimer = null
  nestedMenuY = 0
  nestedMenuX = 0

  setInitialBaseRecords() {
    const { item } = this.props
    let menuItems = [item]
    if (item.subItems) {
      menuItems = [...item.subItems]
    }
    this.setState({
      baseDropDownRecords: menuItems,
    })
  }

  closeDropdown = () => {
    this.setState({
      dropdownOpen: false,
      menuItemOpenId: null,
      baseDropDownRecords: [],
      breadcrumbDropDownRecords: [],
      hoverTimer: null,
    })
    this.nestedMenuX = 0
    this.nestedMenuY = 0
  }

  closeNestedMenu = () => {
    this.setState({
      menuItemOpenId: null,
      breadcrumbDropDownRecords: [],
    })
    this.nestedMenuY = 0
  }

  openBreadcrumb() {
    this.setInitialBaseRecords()
    this.setState({
      dropdownOpen: true,
    })
    clearTimeout(this.state.hoverTimer)
  }

  async breadcrumbDive(diveItem) {
    const { onBreadcrumbDive } = this.props
    if (!onBreadcrumbDive) return
    const breadcrumbDropDownRecords = await onBreadcrumbDive(diveItem)
    this.setState({
      breadcrumbDropDownRecords,
      menuItemOpenId: diveItem.id,
    })
  }

  onBreadcrumbHoverOver = () => {
    const { isTouchDevice, isSmallScreen } = this.props
    // The hover even fires on mobile after a click
    if (isTouchDevice && isSmallScreen) return
    this.openBreadcrumb()
  }

  onBreadcrumbHoverOut = async ev => {
    this.setState({
      hoverTimer: setTimeout(this.closeDropdown, HOVER_TIMEOUT_MS - 250),
    })
  }

  onBreadcrumbClick = ev => {
    const { isTouchDevice, isSmallScreen } = this.props
    // The dropdown should only show up on touch devices large enough to handle it
    if (isTouchDevice && !isSmallScreen) {
      ev.stopPropagation()
      this.openBreadcrumb()
    } else {
      const { item } = this.props
      ev.preventDefault()
      this.props.onBreadcrumbClick(item.id)
    }
  }

  onDropdownHoverOver = () => {
    // Keep the dropdown open in the same was as hovering over a breadcrumb
    this.setState({
      dropdownOpen: true,
    })
    clearTimeout(this.state.hoverTimer)
  }

  onDropdownBreadcrumbClick = item => {
    this.props.onBreadcrumbClick(item.id)
  }

  onDropdownHoverOut = async ev => {
    this.setState({
      hoverTimer: setTimeout(this.closeDropdown, HOVER_TIMEOUT_MS),
    })
  }

  setNestedBaseRecords(item) {
    const { baseDropDownRecords } = this.state
    const existingIdx = _.findIndex(
      baseDropDownRecords,
      menuItem => menuItem.id === item.id
    )
    if (existingIdx > -1) {
      this.nestedMenuY = existingIdx * NEST_AMOUNT_Y_PX
      return
    }
    const idx = _.findIndex(
      baseDropDownRecords,
      menuItem => menuItem.id === this.state.menuItemOpenId
    )
    let cutRecords = [...baseDropDownRecords]
    let lastNestedLevel = -1
    if (idx > -1) {
      cutRecords = baseDropDownRecords.splice(0, idx + 1)
      const lastItem = cutRecords[cutRecords.length - 1]
      lastNestedLevel = lastItem.nested
    }

    cutRecords.push(item)
    item.nested = lastNestedLevel + 1

    this.setState({
      baseDropDownRecords: [...cutRecords],
    })
    this.nestedMenuY = (baseDropDownRecords.length - 1) * NEST_AMOUNT_Y_PX
  }

  onDiveClick = async (item, level, ev) => {
    const { menuItemOpenId } = this.state
    this.nestedMenuX = MENU_WIDTH
    this.setState({
      nestedMenuLoading: true,
    })
    await this.breadcrumbDive(item)
    if (!item.nested && menuItemOpenId && menuItemOpenId !== item.id) {
      this.setNestedBaseRecords(item)
      // If the menu is moving back to the left position, we have to cancel
      // out the hover out timer on the menu so it doesn't close while it's
      // moving over there (because your mouse technically hovers off of it)
      setTimeout(() => {
        clearTimeout(this.nestedMenuTimer)
        clearTimeout(this.state.hoverTimer)
      }, HOVER_TIMEOUT_MS - 50)
    } else {
      this.nestedMenuY = (item.nested || 0) * NEST_AMOUNT_Y_PX
    }
    this.setState({
      nestedMenuLoading: false,
    })
  }

  onNestedMenuHoverOver = () => {
    this.setState({
      dropdownOpen: true,
    })
    clearTimeout(this.state.hoverTimer)
    clearTimeout(this.nestedMenuTimer)
  }

  onNestedMenuHoverOut = () => {
    this.nestedMenuTimer = setTimeout(
      this.closeNestedMenu,
      HOVER_TIMEOUT_MS + 50
    )
    this.setState({
      hoverTimer: setTimeout(this.closeDropdown, HOVER_TIMEOUT_MS),
    })
  }

  renderNesting(menuItem) {
    if (menuItem.nested === 0) return null
    const nestLines = _.range(0, menuItem.nested - 1).map(nestLevel => (
      <NestedLineHolder key={nestLevel}>
        <NestedLineIcon />
      </NestedLineHolder>
    ))
    return (
      <Fragment>
        {nestLines}
        <NestedArrowHolder>
          <NestedArrowIcon />
        </NestedArrowHolder>
      </Fragment>
    )
  }

  renderMenuNameWithTooltip(menuItem) {
    if (menuItem.name.length < 20) return menuItem.name
    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={menuItem.name}
        placement="top"
      >
        <span>{menuItem.name}</span>
      </Tooltip>
    )
  }

  renderIcon() {
    const { item } = this.props
    if (!item.icon) return null
    return item.icon
  }

  renderDropdown() {
    const {
      breadcrumbDropDownRecords,
      baseDropDownRecords,
      dropdownOpen,
      menuItemOpenId,
    } = this.state
    // const { item } = this.props
    if (!dropdownOpen) return null
    const itemWidth = '90%'

    return (
      <StyledMenuWrapper style={{ marginTop: '0px', left: '-20px' }}>
        <StyledMenu
          width={MENU_WIDTH}
          onMouseOver={this.onDropdownHoverOver}
          onMouseOut={this.onDropdownHoverOut}
        >
          {(!menuItemOpenId || this.nestedMenuX !== 0) &&
            baseDropDownRecords.map(menuItem => (
              <StyledMenuItem
                key={menuItem.id}
                style={{ paddingLeft: '10px', width: itemWidth }}
              >
                <StyledMenuButton
                  onClick={() => this.onDropdownBreadcrumbClick(menuItem)}
                  style={{ maxWidth: '200px', width: '86%' }}
                >
                  {this.renderNesting(menuItem)}
                  {this.renderIcon()}
                  {this.renderMenuNameWithTooltip(menuItem)}
                </StyledMenuButton>
                {menuItem.has_children && (
                  <DiveButton onClick={ev => this.onDiveClick(menuItem, 1, ev)}>
                    <BreadcrumbCaretIcon />
                  </DiveButton>
                )}
              </StyledMenuItem>
            ))}
        </StyledMenu>
        {menuItemOpenId && (
          <StyledMenuWrapper
            offsetPosition={{ x: this.nestedMenuX, y: this.nestedMenuY }}
          >
            <StyledMenu
              width={MENU_WIDTH}
              onMouseOver={this.onNestedMenuHoverOver}
              onMouseOut={this.onNestedMenuHoverOut}
            >
              {breadcrumbDropDownRecords.map(menuItem => (
                <StyledMenuItem key={menuItem.id} style={{ width: itemWidth }}>
                  <StyledMenuButton
                    onClick={() => this.onDropdownBreadcrumbClick(menuItem)}
                    style={{ maxWidth: '200px', width: '86%' }}
                  >
                    {this.renderIcon()}
                    {this.renderMenuNameWithTooltip(menuItem)}
                  </StyledMenuButton>
                  {menuItem.has_children && (
                    <DiveButton
                      onClick={ev => this.onDiveClick(menuItem, 2, ev)}
                    >
                      <BreadcrumbCaretIcon />
                    </DiveButton>
                  )}
                </StyledMenuItem>
              ))}
            </StyledMenu>
          </StyledMenuWrapper>
        )}
      </StyledMenuWrapper>
    )
  }

  render() {
    const {
      backgroundColor,
      item,
      index,
      numItems,
      restoreBreadcrumb,
    } = this.props
    const isLast = index === numItems - 1

    return (
      <Fragment key={index}>
        <StyledBreadcrumbItem
          data-cy="Breadcrumb"
          ref={this.props.forwardedRef}
          isLast={isLast}
          onMouseOver={this.onBreadcrumbHoverOver}
          onMouseOut={this.onBreadcrumbHoverOut}
          onClick={this.onBreadcrumbClick}
          backgroundColor={backgroundColor}
        >
          {item.link && (
            <Tooltip
              title={`switch to ${item.name}'s actual location`}
              placement="top"
            >
              <StyledRestoreButton onClick={restoreBreadcrumb}>
                <LinkIconSm />
              </StyledRestoreButton>
            </Tooltip>
          )}
          {item.ellipses || item.truncatedName ? (
            <a href={item.path}>{item.truncatedName}…</a>
          ) : (
            <a href={item.path}>{item.name}</a>
          )}
        </StyledBreadcrumbItem>
        {this.renderDropdown()}
        {!isLast && <StyledBreadcrumbCaret>&#62;</StyledBreadcrumbCaret>}
      </Fragment>
    )
  }
}

export const breadcrumbItemPropType = {
  name: PropTypes.string.isRequired,
  truncatedName: PropTypes.string,
  id: PropTypes.string,
  identifier: PropTypes.string,
  type: PropTypes.string,
  can_edit_content: PropTypes.bool,
  ellipses: PropTypes.bool,
  has_children: PropTypes.bool,
  subMenuOpen: PropTypes.bool,
  icon: PropTypes.element,
}

BreadcrumbItem.propTypes = {
  item: PropTypes.shape(breadcrumbItemPropType).isRequired,
  index: PropTypes.number.isRequired,
  numItems: PropTypes.number.isRequired,
  restoreBreadcrumb: PropTypes.func.isRequired,
  onBreadcrumbDive: PropTypes.func,
  onBreadcrumbClick: PropTypes.func,
  forwardedRef: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),
  isTouchDevice: PropTypes.bool,
  isSmallScreen: PropTypes.bool,
  backgroundColor: PropTypes.string,
}

BreadcrumbItem.defaultProps = {
  onBreadcrumbClick: () => {},
  onBreadcrumbDive: null,
  forwardedRef: React.createRef(),
  isTouchDevice: false,
  isSmallScreen: false,
  backgroundColor: null,
}
BreadcrumbItem.displayName = 'BreadcrumbItem'

export default BreadcrumbItem
