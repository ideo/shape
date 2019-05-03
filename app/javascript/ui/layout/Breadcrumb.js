import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { apiStore, routingStore } from '~/stores'
import v from '~/utils/variables'
import Tooltip from '~/ui/global/Tooltip'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import BreadcrumbItem from '~/ui/layout/BreadcrumbItem'

const BreadcrumbPadding = styled.div`
  height: 1.7rem;
`
BreadcrumbPadding.displayName = 'BreadcrumbPadding'

const StyledBreadcrumbWrapper = styled.div`
  margin-top: 0.5rem;
  height: 1.2rem;
  white-space: nowrap;
  line-height: 1;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  color: ${v.colors.commonDark};
  letter-spacing: 1.1px;
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

@observer
class Breadcrumb extends React.Component {
  constructor(props) {
    super(props)
    this.breadcrumbWrapper = props.breadcrumbWrapper
  }

  componentDidMount() {
    const { record, isHomepage } = this.props
    if (isHomepage) return
    // this will set record.inMyCollection = true/false
    apiStore.checkInMyCollection(record)
  }

  calculateMaxChars = () => {
    let width = this.props.containerWidth
    if (!width) {
      if (!this.breadcrumbWrapper.current) return 80
      width = this.breadcrumbWrapper.current.offsetWidth
    }
    // roughly .075 characters per pixel
    return _.round(width * 0.08)
  }

  get previousItem() {
    const items = this.items(false)
    if (items.length > 1) {
      return items[items.length - 2]
    }
    return null
  }

  items = (clamp = true) => {
    const { maxDepth, record } = this.props
    const items = []
    let middleName = ''
    if (record.inMyCollection) {
      items.push({
        type: 'collections',
        id: 'homepage',
        identifier: 'homepage',
        name: 'My Collection',
        can_edit_content: true,
        truncatedName: null,
        ellipses: false,
      })
    }
    if (!record.breadcrumb) return items
    const len = record.breadcrumb.length
    const longBreadcrumb = maxDepth && len >= maxDepth

    _.each(record.breadcrumb, (item, idx) => {
      const { type, id } = item
      const identifier = `${type}_${id}`

      if (longBreadcrumb && idx >= 2 && idx <= len - 3) {
        // if we have a really long breadcrumb we compress some options in the middle
        if (middleName) middleName += ' > '
        middleName += item.name
        if (idx == len - 3) {
          return items.push({
            ...item,
            name: middleName,
            ellipses: true,
            identifier,
          })
        }
        return
      }
      return items.push({
        ...item,
        truncatedName: null,
        ellipses: false,
        identifier,
      })
    })

    const depth = clamp && maxDepth ? maxDepth * -1 : 0
    return _.compact(items).slice(depth)
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
    return this.totalNameLength(items) - this.calculateMaxChars()
  }

  get truncatedItems() {
    return this.truncateItems(this.items())
  }

  truncateItems = items => {
    let charsLeftToTruncate = this.charsToTruncateForItems(items)
    // If we are within allowable number of chars, return items
    if (charsLeftToTruncate <= 0) return items

    // First try truncating any long items to 25 chars
    _.each(items, item => {
      if (!item.ellipses && item.name && item.name.length > 25) {
        item.truncatedName = item.name.slice(0, 24)
      }
    })

    charsLeftToTruncate = this.charsToTruncateForItems(items)

    if (charsLeftToTruncate <= 0) return items

    if (items.length === 1) {
      const [item] = items
      item.truncatedName = item.name.slice(0, this.calculateMaxChars())
      return items
    }

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

    // last step! combine multiple consecutive ellipses
    if (items.length > 4) {
      _.each(items, (item, idx) => {
        const next = items[idx + 1]
        if (item.ellipses && next && next.ellipses) {
          next.name = `${item.name} > ${next.name}`
          item.remove = true
        }
      })
    }

    return _.reject(items, { remove: true })
  }

  renderBackButton() {
    const { backButton } = this.props
    const item = this.previousItem
    if (!backButton || !item) return null
    let path
    if (item.id === 'homepage') {
      path = routingStore.pathTo('homepage')
    } else {
      path = routingStore.pathTo(item.type, item.id)
    }
    return (
      <Link to={path}>
        <Tooltip title={item.name}>
          <BackIconContainer>
            <ArrowIcon />
          </BackIconContainer>
        </Tooltip>
      </Link>
    )
  }

  render() {
    const { record, isHomepage } = this.props
    const { inMyCollection, breadcrumb } = record
    const renderItems =
      !isHomepage &&
      // wait until we load this value before rendering
      inMyCollection !== null &&
      breadcrumb &&
      breadcrumb.length > 0
    const items = this.truncatedItems
    // We need a ref to wrapper so we always render that
    // Tried using innerRef on styled component but it isn't available on mount
    return (
      <div ref={this.breadcrumbWrapper}>
        {!renderItems && <BreadcrumbPadding />}
        {renderItems && (
          <StyledBreadcrumbWrapper>
            {this.renderBackButton()}
            {items.map((item, index) => (
              <span className="breadcrumb_item" key={item.name}>
                <BreadcrumbItem
                  identifier={item.identifier}
                  item={item}
                  index={index}
                  numItems={items.length}
                />
              </span>
            ))}
          </StyledBreadcrumbWrapper>
        )}
      </div>
    )
  }
}

// TODO move wrapped props to certain place?
Breadcrumb.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool.isRequired,
  breadcrumbWrapper: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),
  containerWidth: PropTypes.number,
  maxDepth: PropTypes.number,
  backButton: PropTypes.bool,
}

Breadcrumb.defaultProps = {
  breadcrumbWrapper: React.createRef(),
  containerWidth: null,
  maxDepth: 6,
  backButton: false,
}

export default Breadcrumb
