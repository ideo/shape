import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

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
`
StyledBreadcrumbWrapper.displayName = 'StyledBreadcrumb'

const StyledBreadcrumbItem = styled.div`
  display: inline-block;
  line-height: 1;
  font-size: 1rem;
  margin-right: 0.5rem;
  font-weight: ${v.weights.book};
  color: ${v.colors.cloudy};
  letter-spacing: 1.1px;
  font-family: ${v.fonts.sans};
  max-width: ${props => props.maxWidth};
  overflow: hidden;
  text-overflow: ellipsis;

  &::after {
    position: relative;
    top: -2px;
    content: ' > ';
  }
  &:last-child::after {
    content: '';
  }
  a {
    color: ${v.colors.cloudy};
    text-decoration: none;
    display: inline-block;
  }
`

const TruncateIfGreaterThanOrEqualTo = 3

@observer
class Breadcrumb extends React.Component {
  componentDidMount() {
    const { record, isHomepage } = this.props
    if (isHomepage) return
    // this will set record.inMyCollection = true/false
    apiStore.checkInMyCollection(record)
  }

  items() {
    const { record } = this.props
    const items = record.breadcrumb
    if (record.inMyCollection) {
      items.unshift(['collections', 'homepage', 'My Collection'])
    }
    return items
  }

  widthForItemIndex = index => {
    // "My collection" makes it the actual length
    const numItems = this.items.length + 1
    // If in the middle of the breadcrumb, make it tiny
    if (numItems >= TruncateIfGreaterThanOrEqualTo) {
      if (this.truncateToEllipses(index)) {
        return '20px'
      }
      return '25%'
    }
    // Otherwise set percent width
    return `${(1 / numItems) * 100}%`
  }

  truncateToEllipses = index => {
    if (numItems < TruncateIfGreaterThanOrEqualTo) return false
    if (index > 0 && index < numItems - 1) return true
    return false
  }

  breadcrumbItem = item => {
    const [klass, id, name] = item
    let path
    if (id === 'homepage') {
      path = routingStore.pathTo('homepage')
    } else {
      path = routingStore.pathTo(klass, id)
    }
    return (
      <StyledBreadcrumbItem
        maxWidth={this.widthForItemIndex(index)}
        key={path}
        data-cy="Breadcrumb"
      >
        <Tooltip classes={{ tooltip: 'Tooltip' }} title={name} placement="top">
          <Link to={path}>{ellipses ? '...' : name}</Link>
        </Tooltip>
      </StyledBreadcrumbItem>
    )
  }

  renderMyCollection = () => {
    const { record } = this.props
    if (!record.inMyCollection) return ''
    return this.breadcrumbItem(['collections', 'homepage', 'My Collection'])
  }

  renderItems = () => {
    const { record } = this.props
    const links = record.breadcrumb.map(item => this.breadcrumbItem(item))
    return (
      <StyledBreadcrumbWrapper>
        {this.renderMyCollection()}
        {links}
      </StyledBreadcrumbWrapper>
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
    )
      return this.renderItems()
    return <BreadcrumbPadding />
  }
}

Breadcrumb.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool.isRequired,
}

export default Breadcrumb
