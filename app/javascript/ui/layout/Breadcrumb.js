import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import Tooltip from '~/ui/global/Tooltip'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import BreadcrumbItem, {
  breadcrumbItemPropType,
} from '~/ui/layout/BreadcrumbItem'

const BreadcrumbPadding = styled.div`
  height: 1.7rem;
`
BreadcrumbPadding.displayName = 'BreadcrumbPadding'

const StyledBreadcrumbWrapper = styled.div`
  margin-top: 0.5rem;
  height: 1.2rem;
  display: flex;
  white-space: nowrap;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  color: ${v.colors.commonDark};
  letter-spacing: 1.1px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    margin-top: 0;
  }
`
StyledBreadcrumbWrapper.displayName = 'StyledBreadcrumbWrapper'

const BackIconContainer = styled.span`
  color: ${v.colors.black};
  transition: ${v.transition};
  &:hover {
    cursor: pointer;
    color: ${v.colors.primaryDarkest};
  }
  display: inline-block;
  height: 18px;
  margin-right: 8px;
  width: 12px;
  vertical-align: middle;
`

class Breadcrumb extends React.Component {
  constructor(props) {
    super(props)
    this.breadcrumbWrapper = props.breadcrumbWrapper
  }

  get previousItem() {
    const { items } = this.props
    if (items.length > 1) {
      return items[items.length - 2]
    }
    return null
  }

  get maxChars() {
    let width = this.props.containerWidth
    if (!width) {
      if (!this.breadcrumbWrapper.current) return 80
      width = this.breadcrumbWrapper.current.offsetWidth
    }
    // roughly .075 characters per pixel
    return _.round(width * 0.08)
  }

  // totalNameLength keeps getting called, with items potentially truncated
  totalNameLength = items => {
    if (!items) return 0
    const sumby = _.sumBy(items, item => {
      let len = 0
      if (item.ellipses) return 0
      if (item.truncatedName && item.truncatedName.length)
        len = item.truncatedName.length
      else if (item.name) len = item.name.length

      return len
    })
    return sumby
  }

  charsToTruncateForItems = items => {
    return this.totalNameLength(items) - this.maxChars
  }

  transformToSubItems(items, firstItem = {}, lastItem = {}) {
    const subItems = items.map((item, idx) => {
      const subItem = { ...item }
      if (item.ellipses && item.id !== firstItem.id) item.remove = true
      if (lastItem && item.id === lastItem.id) subItem.isEllipsesLink = true
      subItem.nested = idx
      return subItem
    })
    return subItems
  }

  addSubItems(copyItems) {
    const { items, maxDepth } = this.props
    if (maxDepth === 1) {
      const subItems = this.transformToSubItems(items, copyItems[0])
      if (copyItems[0]) copyItems[0].subItems = subItems
    }

    const ellipsesItems = copyItems.filter(item => item.ellipses)
    let subItems
    if (ellipsesItems.length) {
      const firstEllipsesItem = ellipsesItems.shift()
      const lastEllipsesItem = ellipsesItems.pop()
      subItems = this.transformToSubItems(
        copyItems,
        firstEllipsesItem,
        lastEllipsesItem
      )
      firstEllipsesItem.subItems = subItems
      if (lastEllipsesItem) {
        firstEllipsesItem.id = lastEllipsesItem.id
      }
    } else {
      subItems = this.transformToSubItems(copyItems)
    }

    if (copyItems[0] && copyItems[0].identifier === 'homepage') {
      copyItems[0].subItems = subItems
    }
    return copyItems
  }

  get truncatedItems() {
    const { items, maxDepth } = this.props
    const copyItems = [...items]
    // The mobile menu should have the full breadcrumb trail in it's one item
    if (copyItems.length === 1) {
      return copyItems
    }
    if (maxDepth === 1) {
      // make an array of the last item and transform via addSubItems
      return this.addSubItems(copyItems.slice(-1))
    }

    let charsLeftToTruncate = this.charsToTruncateForItems(copyItems)

    // If we are within allowable number of chars, return items
    if (charsLeftToTruncate <= 0) return copyItems

    // Item names are still too long, show ... in place of their name
    // Start at the midpoint, floor-ing to favor adding ellipses farther up the breadcrumb
    let index = _.floor((copyItems.length - 1) / 2)

    // If event number of items, increment index first,
    // otherwise if odd, decrement first
    let increment = copyItems.length % 2 === 0
    let jumpBy = 1

    while (charsLeftToTruncate > 0) {
      const item = copyItems[index]
      if (!item) break
      if (!item.ellipses) {
        // Subtract this item from chars to truncate
        charsLeftToTruncate -= item.truncatedName
          ? item.truncatedName.length
          : item.name.length
        // Continue marking for truncation until we reduce it to be short enough
        item.ellipses = true
        // clear out truncatedName so that just the ellipses is printed out
        item.truncatedName = null
      }
      // Traverse on either side of midpoint
      index = increment ? index + jumpBy : index - jumpBy
      jumpBy += 1
      increment = !increment
    }

    const modifiedItems = this.addSubItems([...copyItems])

    return _.reject(modifiedItems, { remove: true })
  }

  onRestoreBreadcrumb = item => {
    this.props.onRestore(item)
  }

  renderBackButton() {
    const { showBackButton, onBack } = this.props
    const item = this.previousItem
    if (!showBackButton || !item) return null

    return (
      <button onClick={() => onBack(item)} data-cy="BreadcrumbBackButton">
        <Tooltip title={item.name}>
          <BackIconContainer>
            <ArrowIcon />
          </BackIconContainer>
        </Tooltip>
      </button>
    )
  }

  render() {
    const {
      breadcrumbItemComponent,
      items,
      isSmallScreen,
      isTouchDevice,
      onBreadcrumbDive,
    } = this.props
    const renderItems = items.length > 0
    const { truncatedItems } = this
    // We need a ref to wrapper so we always render that
    // Tried using innerRef on styled component but it isn't available on mount

    const BreadcrumbItemComponent = breadcrumbItemComponent || BreadcrumbItem

    return (
      <div ref={this.breadcrumbWrapper}>
        {!renderItems && <BreadcrumbPadding />}
        {renderItems && (
          <StyledBreadcrumbWrapper>
            {this.renderBackButton()}
            {truncatedItems.map((item, index) => (
              <span
                key={`${item.name}-${index}`}
                style={{ position: 'relative' }}
              >
                <BreadcrumbItemComponent
                  identifier={item.identifier}
                  item={item}
                  index={index}
                  numItems={truncatedItems.length}
                  onBreadcrumbClick={this.props.onBreadcrumbClick}
                  restoreBreadcrumb={() => this.onRestoreBreadcrumb(item)}
                  onBreadcrumbDive={onBreadcrumbDive}
                  isTouchDevice={isTouchDevice}
                  isSmallScreen={isSmallScreen}
                />
              </span>
            ))}
          </StyledBreadcrumbWrapper>
        )}
      </div>
    )
  }
}

Breadcrumb.propTypes = {
  /**
   * A list of breadcrumb items to display
   */
  items: PropTypes.arrayOf(PropTypes.shape(breadcrumbItemPropType)).isRequired,
  /**
   * Another component to wrap the whole breacrumb
   */
  breadcrumbWrapper: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),
  /**
   * A component to wrap each breadcrumb item
   */
  breadcrumbItemComponent: PropTypes.elementType,
  /**
   * The action to take when going back in the breadcrumb UI
   */
  onBack: PropTypes.func.isRequired,
  /**
   * The action to take when diving into a sub breadcrumb
   */
  onBreadcrumbDive: PropTypes.func,
  /**
   * The action to take when restoring a breadcrumb (Shape specific)
   */
  onRestore: PropTypes.func,
  /**
   * The action to take when clicking on a breadcrumb, which is likely navigation
   * of some sort
   */
  onBreadcrumbClick: PropTypes.func,
  /**
   * The width of the parent container of the breadcrumb, used to limit it's size
   */
  containerWidth: PropTypes.number,
  /**
   * The maximum depth a breadcrumb sub menu can go
   */
  maxDepth: PropTypes.number,
  /**
   * Whether to show the back button at all
   */
  showBackButton: PropTypes.bool,
  /**
   * Visible hide the breadcrumb but ensure it still takes up space
   */
  visiblyHidden: PropTypes.bool,
  /**
   * Whether the current device is a touch device. Should be used to improve
   * the user experience.
   */
  isTouchDevice: PropTypes.bool,
  /**
   * Whether the current device is a phone size device. Should be used to improve
   * the user experience.
   */
  isSmallScreen: PropTypes.bool,
}

Breadcrumb.defaultProps = {
  breadcrumbWrapper: React.createRef(),
  breadcrumbItemComponent: null,
  onRestore: () => {},
  onBreadcrumbClick: () => {},
  onBreadcrumbDive: null,
  containerWidth: null,
  maxDepth: 6,
  showBackButton: false,
  visiblyHidden: false,
  isTouchDevice: false,
  isSmallScreen: false,
}

export default Breadcrumb
