import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { apiStore, routingStore } from '~/stores'
import v from '~/utils/variables'

const BreadcrumbPadding = styled.div`
  height: 1.7rem;
`
BreadcrumbPadding.displayName = 'BreadcrumbPadding'

const StyledBreadcrumb = styled.div`
  margin-top: 0.5rem;
  height: 1.2rem;
  white-space: nowrap; /* better this way for responsive? */
  .crumb {
    display: inline-block;
    line-height: 1;
    font-size: 1rem;
    margin-right: 0.5rem;
    font-weight: ${v.weights.book};
    color: ${v.colors.cloudy};
    letter-spacing: 1.1px;
    font-family: ${v.fonts.sans};

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
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`

StyledBreadcrumb.displayName = 'StyledBreadcrumb'

@observer
class Breadcrumb extends React.Component {
  breadcrumbItem = item => {
    const [klass, id, name] = item
    let path = routingStore.pathTo(klass, id)
    if (
      name === 'My Collection' &&
      id === apiStore.currentUser.current_user_collection_id
    ) {
      path = routingStore.pathTo('homepage')
    }
    return (
      <span className="crumb" key={path} data-cy="Breadcrumb">
        <Link to={path}>{name}</Link>
      </span>
    )
  }

  renderItems = () => {
    const { items } = this.props
    const links = items.map(item => this.breadcrumbItem(item))
    return <StyledBreadcrumb>{links}</StyledBreadcrumb>
  }

  render() {
    const { items } = this.props
    if (items.length > 0) return this.renderItems()
    return <BreadcrumbPadding />
  }
}

Breadcrumb.propTypes = {
  items: MobxPropTypes.arrayOrObservableArray,
}
Breadcrumb.defaultProps = {
  items: [],
}

export default Breadcrumb
