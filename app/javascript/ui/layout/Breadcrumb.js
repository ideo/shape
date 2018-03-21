import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { routingStore } from '~/stores'

const BreadcrumbPadding = styled.div`
  height: 1.7rem;
`
BreadcrumbPadding.displayName = 'BreadcrumbPadding'

const StyledBreadcrumb = styled.div`
  margin-top: 0.5rem;
  height: 1.2rem;
  white-space: nowrap; /* better this way for responsive? */
  a {
    font-size: 1rem;
    font-weight: 100;
    color: #9b9b9b;
    letter-spacing: 1.5px;
    font-family: 'Gotham';

    text-decoration: none;

    &:last-child:after {
      content: '';
    }
    &:after {
      content: ' > ';
    }
  }
`

StyledBreadcrumb.displayName = 'StyledBreadcrumb'

class Breadcrumb extends React.PureComponent {
  breadcrumbItem = (item) => {
    const [klass, id, name] = item
    const path = routingStore.pathTo(klass, id)
    return (
      <Link key={path} to={path}>
        {name}
      </Link>
    )
  }

  renderItems = () => {
    const { items } = this.props
    const links = items.map(item => this.breadcrumbItem(item))
    return (
      <StyledBreadcrumb>
        <Link key="myCollection" to="/">My Collection</Link>
        {links}
      </StyledBreadcrumb>
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
