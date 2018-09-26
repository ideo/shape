import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import Tooltip from '~/ui/global/Tooltip'
import { routingStore } from '~/stores'
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
  widthForItemIndex = index => {
    // "My collection" makes it the actual length
    const numItems = this.props.items.length + 1
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
    const numItems = this.props.items.length
    if (numItems < TruncateIfGreaterThanOrEqualTo) return false
    if (index > 0 && index < numItems - 1) return true
    return false
  }

  breadcrumbItem = (item, index) => {
    const [klass, id, name] = item
    const path = routingStore.pathTo(klass, id)
    const ellipses = this.truncateToEllipses(index)
    console.log(index, this.widthForItemIndex(index))
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

  renderItems = () => {
    const { items } = this.props
    const links = items.map((item, index) =>
      this.breadcrumbItem(item, index + 1)
    )
    return (
      <StyledBreadcrumbWrapper>
        <StyledBreadcrumbItem
          maxWidth={this.widthForItemIndex(0)}
          key="myCollection"
        >
          <Link to={routingStore.pathTo('homepage')}>My Collection</Link>
        </StyledBreadcrumbItem>
        {links}
      </StyledBreadcrumbWrapper>
    )
  }

  render() {
    const { items } = this.props
    if (items.length > 0) return this.renderItems()
    return <BreadcrumbPadding />
  }
}

Breadcrumb.propTypes = {
  items: MobxPropTypes.arrayOrObservableArray.isRequired,
}

export default Breadcrumb
