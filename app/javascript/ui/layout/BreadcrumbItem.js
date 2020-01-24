import React, { Fragment } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import axios from 'axios'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, observable, runInAction } from 'mobx'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { routingStore, uiStore } from '~/stores'
import LinkIconSm from '~/ui/icons/LinkIconSm'
import BreadcrumbCaretIcon from '~/ui/icons/BreadcrumbCaretIcon'
import CollectionIconXs from '~/ui/icons/CollectionIconXs'
import FoamcoreBoardIconXs from '~/ui/icons/FoamcoreBoardIconXs'
import SubmissionBoxIconXs from '~/ui/icons/SubmissionBoxIconXs'
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
import WithDropTarget from '~/ui/global/WithDropTarget'

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
  ${props =>
    props.currentlyDraggedOn &&
    `
    background: ${v.colors.primaryLight};
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
  margin-right: -5px;
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

const IconHolder = styled.div`
  color: ${v.colors.commonMedium};
  display: inline-block;
  margin-right: 6px;
  transform: translate(0, -1px);

  .icon.icon {
    transform: none;
    position: static;
    vertical-align: bottom;
  }
`

const NEST_AMOUNT_Y_PX = 45
const MENU_WIDTH = 250
const HOVER_TIMEOUT_MS = 300

@observer
// also export unwrapped component for unit test
export class BreadcrumbItem extends React.Component {
  @observable
  breadcrumbDropDownRecords = []
  @observable
  baseDropDownRecords = []
  @observable
  dropdownOpen = false
  @observable
  menuItemOpenId = null
  hoverTimer = null
  nestedMenuTimer = null
  nestedMenuY = 0
  nestedMenuX = 0

  fetchBreadcrumbRecords = async itemId => {
    const breadcrumbRecordsReq = await axios.get(
      `/api/v1/collections/${itemId}/collection_cards/breadcrumb_records`
    )
    runInAction(() => {
      this.breadcrumbDropDownRecords = breadcrumbRecordsReq.data
      this.menuItemOpenId = itemId
    })
  }

  @action
  closeDropdown = () => {
    this.hoverTimer = null
    this.dropdownOpen = false
    this.menuItemOpenId = null
    this.nestedMenuX = 0
    this.nestedMenuY = 0
    this.baseDropDownRecords = []
  }

  @action
  closeNestedMenu() {
    this.breadcrumbDropDownRecords = []
    this.menuItemOpenId = null
    this.nestedMenuY = 0
  }

  @action
  setInitialBaseRecords() {
    const { item } = this.props
    let menuItems = [item]
    if (item.subItems) {
      menuItems = [...item.subItems]
    }
    this.baseDropDownRecords = menuItems
  }

  @action
  openBreadcrumb() {
    this.setInitialBaseRecords()
    this.dropdownOpen = true
    clearTimeout(this.hoverTimer)
  }

  @action
  onBreadcrumbHoverOver = () => {
    // The hover even fires on mobile after a click
    if (uiStore.isTouchDevice && uiStore.isMobileXs) return
    this.openBreadcrumb()
  }

  onBreadcrumbHoverOut = async ev => {
    this.hoverTimer = setTimeout(this.closeDropdown, HOVER_TIMEOUT_MS - 150)
  }

  onBreadcrumbClick = ev => {
    // The dropdown should only show up on touch devices large enough to handle it
    if (uiStore.isTouchDevice && !uiStore.isMobileXs) {
      ev.stopPropagation()
      this.openBreadcrumb()
    }
  }

  @action
  onDropdownHoverOver = () => {
    // Keep the dropdown open in the same was as hovering over a breadcrumb
    this.dropdownOpen = true
    clearTimeout(this.hoverTimer)
  }

  onDropdownBreadcrumbClick = item => {
    routingStore.routeTo('collections', item.id)
  }

  onDropdownHoverOut = async ev => {
    this.hoverTimer = setTimeout(this.closeDropdown, HOVER_TIMEOUT_MS)
  }

  setNestedBaseRecords(item) {
    const existingIdx = _.findIndex(
      this.baseDropDownRecords,
      menuItem => menuItem.id === item.id
    )
    if (existingIdx > -1) {
      this.nestedMenuY = existingIdx * NEST_AMOUNT_Y_PX
      return
    }
    const idx = _.findIndex(
      this.baseDropDownRecords,
      menuItem => menuItem.id === this.menuItemOpenId
    )
    let cutRecords = [...this.baseDropDownRecords]
    let lastNestedLevel = -1
    if (idx > -1) {
      cutRecords = this.baseDropDownRecords.splice(0, idx + 1)
      const lastItem = cutRecords[cutRecords.length - 1]
      lastNestedLevel = lastItem.nested
    }

    cutRecords.push(item)
    item.nested = lastNestedLevel + 1

    this.baseDropDownRecords = [...cutRecords]
    this.nestedMenuY = (this.baseDropDownRecords.length - 1) * NEST_AMOUNT_Y_PX
  }

  @action
  onDiveClick = (item, level, ev) => {
    this.nestedMenuX = MENU_WIDTH
    this.fetchBreadcrumbRecords(item.id)
    if (
      !item.nested &&
      this.menuItemOpenId &&
      this.menuItemOpenId !== item.id
    ) {
      this.setNestedBaseRecords(item)
      // If the menu is moving back to the left position, we have to cancel
      // out the hover out timer on the menu so it doesn't close while it's
      // moving over there (because your mouse technically hovers off of it)
      setTimeout(() => {
        clearTimeout(this.nestedMenuTimer)
      }, HOVER_TIMEOUT_MS - 50)
    } else {
      this.nestedMenuY = (item.nested || 0) * NEST_AMOUNT_Y_PX
    }
  }

  @action
  onNestedMenuHoverOver = () => {
    this.dropdownOpen = true
    clearTimeout(this.hoverTimer)
    clearTimeout(this.nestedMenuTimer)
  }

  onNestedMenuHoverOut = () => {
    this.nestedMenuTimer = setTimeout(
      this.closeNestedMenu,
      HOVER_TIMEOUT_MS + 50
    )
    this.hoverTimer = setTimeout(this.closeDropdown, HOVER_TIMEOUT_MS)
  }

  renderIcon(menuItem) {
    let icon
    switch (menuItem.collection_type) {
      case 'Collection':
        icon = <CollectionIconXs />
        break
      case 'Collection::Board':
        icon = <FoamcoreBoardIconXs />
        break
      case 'Collection::SubmissionBox':
        icon = <SubmissionBoxIconXs />
        break
    }
    return <IconHolder>{icon}</IconHolder>
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

  renderDropdown() {
    if (!this.dropdownOpen) return null
    const itemWidth = '90%'

    return (
      <StyledMenuWrapper style={{ marginTop: '0px', left: '-20px' }}>
        <StyledMenu
          width={MENU_WIDTH}
          onMouseOver={this.onDropdownHoverOver}
          onMouseOut={this.onDropdownHoverOut}
        >
          {(!this.menuItemOpenId || this.nestedMenuX !== 0) &&
            this.baseDropDownRecords.map(menuItem => (
              <StyledMenuItem
                key={menuItem.id}
                style={{ paddingLeft: '10px', width: itemWidth }}
              >
                <StyledMenuButton
                  onClick={() => this.onDropdownBreadcrumbClick(menuItem)}
                  style={{ maxWidth: '200px' }}
                >
                  {this.renderNesting(menuItem)}
                  {this.renderIcon(menuItem)}
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
        {this.menuItemOpenId && (
          <StyledMenuWrapper
            offsetPosition={{ x: this.nestedMenuX, y: this.nestedMenuY }}
          >
            <StyledMenu
              width={MENU_WIDTH}
              onMouseOver={this.onNestedMenuHoverOver}
              onMouseOut={this.onNestedMenuHoverOut}
            >
              {this.breadcrumbDropDownRecords.map(menuItem => (
                <StyledMenuItem key={menuItem.id} style={{ width: itemWidth }}>
                  <StyledMenuButton
                    onClick={() => this.onDropdownBreadcrumbClick(menuItem)}
                  >
                    {this.renderIcon(menuItem)}
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
    const { item, index, numItems, restoreBreadcrumb } = this.props
    const isLast = index === numItems - 1
    let path
    if (item.id === 'homepage') {
      path = routingStore.pathTo('homepage')
    } else {
      path = routingStore.pathTo(item.type, item.id)
    }
    const { currentlyDraggedOn } = this.props
    const showDrag =
      currentlyDraggedOn &&
      currentlyDraggedOn.item.identifier === item.identifier
    return (
      <Fragment key={path}>
        <StyledBreadcrumbItem
          data-cy="Breadcrumb"
          ref={this.props.forwardedRef}
          currentlyDraggedOn={!!showDrag}
          isLast={isLast}
          onMouseOver={this.onBreadcrumbHoverOver}
          onMouseOut={this.onBreadcrumbHoverOut}
          onClick={this.onBreadcrumbClick}
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
            <Link to={path}>{item.truncatedName}…</Link>
          ) : (
            <Link to={path}>{item.name}</Link>
          )}
        </StyledBreadcrumbItem>
        {this.renderDropdown()}
        {!isLast && <StyledBreadcrumbCaret>&#62;</StyledBreadcrumbCaret>}
      </Fragment>
    )
  }
}

BreadcrumbItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  index: PropTypes.number.isRequired,
  numItems: PropTypes.number.isRequired,
  forwardedRef: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),
  currentlyDraggedOn: MobxPropTypes.objectOrObservableObject,
  restoreBreadcrumb: PropTypes.func.isRequired,
}

BreadcrumbItem.defaultProps = {
  forwardedRef: React.createRef(),
  currentlyDraggedOn: null,
}
BreadcrumbItem.displayName = 'BreadcrumbItem'

export default WithDropTarget(BreadcrumbItem)
