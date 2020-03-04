import _ from 'lodash'
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
    return _.sumBy(items, item => {
      let len = 0
      if (item.ellipses) return
      if (item.truncatedName) len = item.truncatedName.length
      else if (item.name) len = item.name.length

      return len
    })
  }

  charsToTruncateForItems = items => {
    return this.totalNameLength(items) - this.maxChars
  }

  truncateItemName(item, amount) {
    if (!item.ellipses && item.name && item.name.length > amount) {
      item.truncatedName = item.name.slice(0, amount - 1)
    }
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

  addSubItems(items) {
    const { maxDepth } = this.props
    if (maxDepth === 1) {
      const allItems = this.items()
      const subItems = this.transformToSubItems(allItems, items[0])
      if (items[0]) items[0].subItems = subItems
    }

    const ellipsesItems = items.filter(item => item.ellipses)
    let subItems
    if (ellipsesItems.length) {
      const firstEllipsesItem = ellipsesItems.shift()
      const lastEllipsesItem = ellipsesItems.pop()
      subItems = this.transformToSubItems(
        items,
        firstEllipsesItem,
        lastEllipsesItem
      )
      firstEllipsesItem.subItems = subItems
    } else {
      subItems = this.transformToSubItems(items)
    }

    // TODO fix shape-specific logic
    if (items[0] && items[0].name === 'My Collection') {
      items[0].subItems = subItems
    }
  }

  get truncatedItems() {
    const { items } = this.props
    // The mobile menu should have the full breadcrumb trail in it's one item
    if (items.length === 1) {
      const [item] = items
      this.truncateItemName(item, this.maxChars)
      return items
    }

    let charsLeftToTruncate = this.charsToTruncateForItems(items)

    // If we are within allowable number of chars, return items
    if (charsLeftToTruncate <= 0) return items

    // First try truncating any long items to 25 chars
    _.each(items, item => this.truncateItemName(item, 25))

    charsLeftToTruncate = this.charsToTruncateForItems(items)

    // Item names are still too long, show ... in place of their name
    // Start at the midpoint, floor-ing to favor adding ellipses farther up the breadcrumb
    let index = _.floor((items.length - 1) / 2)

    // If event number of items, increment index first,
    // otherwise if odd, decrement first
    let increment = items.length % 2 === 0
    let jumpBy = 1

    while (charsLeftToTruncate > 0) {
      const item = items[index]
      if (!item) break
      // TODO remove shape-specific my collection logic
      if (item.name !== 'My Collection' && !item.ellipses) {
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

    this.addSubItems(items)

    return _.reject(items, { remove: true })
  }

  onRestoreBreadcrumb = item => {
    this.props.onRestore(item)
  }

  renderBackButton() {
    const { showBackButton } = this.props
    const item = this.previousItem
    if (!showBackButton || !item) return null
    return (
      <button onClick={this.props.onBack}>
        <Tooltip title={item.name}>
          <BackIconContainer>
            <ArrowIcon />
          </BackIconContainer>
        </Tooltip>
      </button>
    )
  }

  render() {
    const { items, isSmallScreen, isTouchDevice, onBreadcrumbDive } = this.props
    const renderItems = items.length > 0
    const { truncatedItems } = this
    // We need a ref to wrapper so we always render that
    // Tried using innerRef on styled component but it isn't available on mount
    return (
      <div ref={this.breadcrumbWrapper}>
        {!renderItems && <BreadcrumbPadding />}
        {renderItems && (
          <StyledBreadcrumbWrapper>
            {this.renderBackButton()}
            {truncatedItems.map((item, index) => (
              <span
                className="breadcrumb_item"
                key={`${item.name}-${index}`}
                style={{ position: 'relative' }}
              >
                <BreadcrumbItem
                  identifier={item.identifier}
                  item={item}
                  index={index}
                  numItems={items.length}
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
  items: PropTypes.arrayOf(PropTypes.shape(breadcrumbItemPropType)).isRequired,
  onBack: PropTypes.func.isRequired,
  breadcrumbWrapper: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),
  onBreadcrumbDive: PropTypes.func,
  onRestore: PropTypes.func,
  onBreadcrumbClick: PropTypes.func,
  containerWidth: PropTypes.number,
  maxDepth: PropTypes.number,
  showBackButton: PropTypes.bool,
  visiblyHidden: PropTypes.bool,
  isTouchDevice: PropTypes.bool,
  isSmallScreen: PropTypes.bool,
}

Breadcrumb.defaultProps = {
  breadcrumbWrapper: React.createRef(),
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
