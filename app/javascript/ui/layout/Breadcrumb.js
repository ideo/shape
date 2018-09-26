import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { round, sumBy } from 'lodash'

import { apiStore, routingStore } from '~/stores'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const BreadcrumbPadding = styled.div`
  height: 1.7rem;
`
BreadcrumbPadding.displayName = 'BreadcrumbPadding'

const StyledBreadcrumbWrapper = styled.div`
  margin-top: 0.5rem;
  height: 1.2rem;
  white-space: nowrap; /* better this way for responsive? */
  line-height: 1;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
  color: ${v.colors.cloudy};
  letter-spacing: 1.1px;
`
StyledBreadcrumbWrapper.displayName = 'StyledBreadcrumb'

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

  overflow: hidden;
  text-overflow: ellipsis;
  a {
    color: ${v.colors.cloudy};
    text-decoration: none;
    display: inline-block;
  }
`

@observer
class Breadcrumb extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      width: window.innerWidth,
    }
  }

  componentWillMount = () => {
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentDidMount() {
    const { record, isHomepage } = this.props
    if (isHomepage) return
    // this will set record.inMyCollection = true/false
    apiStore.checkInMyCollection(record)
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleWindowSizeChange)
  }

  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth })
  }

  truncateIfGreaterThanChars = () => {
    const { width } = this.state
    const isMobile = width <= v.responsive.smallBreakpoint
    if (isMobile) return 15
    return 75
  }

  items = () => {
    const { record } = this.props
    const items = []
    if (record.inMyCollection) {
      items.push({
        klass: 'collections',
        id: 'homepage',
        name: 'My Collection',
        truncatedName: 'My Collection',
        ellipses: false,
      })
    }
    record.breadcrumb.map(item =>
      items.push({
        klass: item[0],
        id: item[1],
        name: item[2],
        truncatedName: item[2],
        ellipses: false,
      })
    )
    return items
  }

  totalTruncatedCharNames = items =>
    sumBy(items, item => item.truncatedName.length)

  truncationNeeded = items =>
    this.totalTruncatedCharNames(items) > this.truncateIfGreaterThanChars()

  truncateItems = items => {
    if (!this.truncationNeeded(items)) return items

    // First do a pass and truncate down to 25 chars to see if we can reduce enough
    items.forEach(item => {
      if (item.name.length > 25)
        item.truncatedName = `${item.name.slice(0, 24)}...`
    })

    let charsToTruncate =
      this.totalTruncatedCharNames(items) - this.truncateIfGreaterThanChars()

    if (charsToTruncate <= 0) return items

    // If we're still too long, choose to move some names to only
    // show ... in place of their name
    let jumpBy = 1
    let increment = true
    // Start at the midpoint
    let index = round(items.length / 2) - 1
    while (charsToTruncate > 0) {
      // Continue marking for truncation until we reduce it to be short enough
      items[index].ellipses = true
      // Subtract this item from chars to truncate (adding in 3 for ... chars)
      charsToTruncate -= items[index].truncatedName.length + 3
      // Traverse on either side of midpoint
      index = increment ? index + jumpBy : index - jumpBy
      jumpBy += 1
      increment = !increment
    }
    return items
  }

  breadcrumbItem = (item, index) => {
    const numItems = this.items().length
    const showCaret = index < numItems - 1
    let path, maxWidth
    if (item.id === 'homepage') {
      path = routingStore.pathTo('homepage')
    } else {
      path = routingStore.pathTo(item.klass, item.id)
    }
    if (item.ellipses) {
      // If it marked for ellipses truncation, make it tiny
      maxWidth = '35px'
    } else {
      // Otherwise set percent width
      maxWidth = `${(1 / numItems) * 100}%`
    }
    return (
      <Fragment key={path}>
        <StyledBreadcrumbItem maxWidth={maxWidth} data-cy="Breadcrumb">
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            title={item.name}
            placement="top"
          >
            <Link to={path}>{item.ellipses ? '...' : item.truncatedName}</Link>
          </Tooltip>
        </StyledBreadcrumbItem>
        {showCaret && <StyledBreadcrumbCaret>&#62;</StyledBreadcrumbCaret>}
      </Fragment>
    )
  }

  render() {
    const { record, isHomepage } = this.props
    const { inMyCollection, breadcrumb } = record
    if (
      !isHomepage &&
      // wait until we load this value before rendering
      inMyCollection !== null &&
      breadcrumb &&
      breadcrumb.length > 0
    ) {
      const items = this.truncateItems(this.items())
      return (
        <StyledBreadcrumbWrapper>
          {items.map((item, index) => this.breadcrumbItem(item, index))}
        </StyledBreadcrumbWrapper>
      )
    }
    return <BreadcrumbPadding />
  }
}

Breadcrumb.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool.isRequired,
}

export default Breadcrumb
