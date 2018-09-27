import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { floor, round, sumBy } from 'lodash'

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
  white-space: nowrap;
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
    this.breadcrumbWrapper = React.createRef()
    this.state = {
      maxChars: 80,
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
    this.handleWindowSizeChange()
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleWindowSizeChange)
  }

  handleWindowSizeChange = () => {
    if (!this.breadcrumbWrapper.current) return
    const width = this.breadcrumbWrapper.current.offsetWidth
    // roughly .075 characters per pixel
    this.setState({ maxChars: round(width * 0.075) })
  }

  items = () => {
    const { record } = this.props
    const items = []
    if (record.inMyCollection) {
      items.push({
        klass: 'collections',
        id: 'homepage',
        name: 'My Collection',
        ellipses: false,
      })
    }
    record.breadcrumb.map(item =>
      items.push({
        klass: item[0],
        id: item[1],
        name: item[2],
        ellipses: false,
      })
    )
    return items
  }

  totalTruncatedNameLength = items => sumBy(items, item => item.name.length)

  truncateItems = items => {
    let charsToTruncate =
      this.totalTruncatedNameLength(items) - this.state.maxChars

    if (charsToTruncate <= 0) return items

    // Item names are too long, show ... in place of their name
    // Start at the midpoint, floor-ing to favor adding ellipses farther up the breadcrumb
    let index = floor((items.length - 1) / 2)

    // If event number of items, increment index first,
    // otherwise if odd, decrement first
    let increment = items.length % 2 === 0
    let jumpBy = 1
    while (charsToTruncate > 0) {
      if (items[index].name !== 'My Collection') {
        // Continue marking for truncation until we reduce it to be short enough
        items[index].ellipses = true
        // Subtract this item from chars to truncate (adding in 2 for ... chars)
        charsToTruncate -= items[index].name.length + 2
      }
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
    let path
    if (item.id === 'homepage') {
      path = routingStore.pathTo('homepage')
    } else {
      path = routingStore.pathTo(item.klass, item.id)
    }
    return (
      <Fragment key={path}>
        <StyledBreadcrumbItem data-cy="Breadcrumb">
          {item.ellipses ? (
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title={item.name}
              placement="top"
            >
              <Link to={path}>...</Link>
            </Tooltip>
          ) : (
            <Link to={path}>{item.name}</Link>
          )}
        </StyledBreadcrumbItem>
        {showCaret && <StyledBreadcrumbCaret>&#62;</StyledBreadcrumbCaret>}
      </Fragment>
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
    // We need ref to wrapper so we must render that
    // Tried using innerRef on styled component but it isn't available on mount
    return (
      <div ref={this.breadcrumbWrapper} style={{ width: '80%' }}>
        <StyledBreadcrumbWrapper>
          {renderItems &&
            this.truncateItems(this.items()).map((item, index) =>
              this.breadcrumbItem(item, index)
            )}
        </StyledBreadcrumbWrapper>
      </div>
    )
  }
}

Breadcrumb.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool.isRequired,
}

export default Breadcrumb
