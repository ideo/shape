import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, observable, runInAction } from 'mobx'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { routingStore } from '~/stores'
import LinkIconSm from '~/ui/icons/LinkIconSm'
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

@observer
// also export unwrapped component for unit test
export class BreadcrumbItem extends React.Component {
  @observable
  breadcrumbDropDownRecords = []
  @observable
  dropdownOpen = false
  @observable
  menuItemOpenId = null
  hoverTimer = null

  @action
  closeDropdown = () => {
    // this.breadcrumbDropDownRecords = []
    console.log('close')
    this.hoverTimer = null
    this.dropdownOpen = false
    this.menuItemOpenId = null
  }

  @action
  onHoverOver = () => {
    this.dropdownOpen = true
    clearTimeout(this.hoverTimer)
  }

  onBreadcrumbHoverOut = async ev => {
    this.hoverTimer = setTimeout(this.closeDropdown, 150)
  }

  onDropdownHoverOut = async ev => {
    this.hoverTimer = setTimeout(this.closeDropdown, 150)
  }

  onNavigationClick = async ev => {
    const record = this.props.item
    if (record.type === 'collections') {
      // TODO cache this data locally?
      const breadcrumbRecordsReq = await axios.get(
        `/api/v1/collections/${record.id}/collection_cards/breadcrumb_records`
      )
      runInAction(() => {
        this.breadcrumbDropDownRecords = breadcrumbRecordsReq.data
        this.menuItemOpenId = record.id
      })
    }
  }

  renderDropdown() {
    const { item } = this.props
    if (!this.dropdownOpen) return null
    // const menuItems = this.breadcrumbDropDownRecords.map(record => ({
    //   name: record.name,
    //   onClick: () => console.log(record.id),
    // }))
    let menuItems = [item.name]
    const splitName = item.name.split('>')
    if (item.ellipses && splitName.length > 1) {
      menuItems = splitName
    }
    return (
      <StyledMenuWrapper style={{ marginTop: '-8px' }}>
        <StyledMenu
          width={200}
          onMouseOver={this.onHoverOver}
          onMouseLeave={this.onDropdownHoverOut}
        >
          {menuItems.map(menuItem => (
            <StyledMenuItem key={menuItem}>
              <StyledMenuButton onClick={this.onItemClick}>
                {menuItem}
              </StyledMenuButton>
              <button onClick={this.onNavigationClick}>></button>
            </StyledMenuItem>
          ))}
        </StyledMenu>
        {this.menuItemOpenId && (
          <StyledMenuWrapper offsetPosition={{ x: 200, y: 0 }}>
            <StyledMenu width={200}>
              {this.breadcrumbDropDownRecords.map(menuItem => (
                <StyledMenuItem key={menuItem.name}>
                  <StyledMenuButton onClick={this.onItemClick}>
                    {menuItem.name}
                  </StyledMenuButton>
                  <button onClick={this.onNavigationClick}>></button>
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
          onMouseOver={this.onHoverOver}
          onMouseOut={this.onBreadcrumbHoverOut}
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
