import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const BreadcrumbPadding = styled.div`
  height: 1.7rem;
`

const StyledBreadcrumb = styled.div`
  margin-top: 0.5rem;
  height: 1.2rem;
  a {
    font-size: 15px;
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

class Breadcrumb extends React.PureComponent {
  breadcrumbItem = (item) => {
    const [klass, id, name] = item
    const path = `/${klass}/${id}`
    return (
      <Link key={path} to={path}>
        {name}
      </Link>
    )
  }

  render() {
    const { items } = this.props
    const links = items.map(item => this.breadcrumbItem(item))
    return (
      <StyledBreadcrumb>
        <Link key='myCollection' to='/'>My Collection</Link>
        {links}
      </StyledBreadcrumb>
    )
  }
}

Breadcrumb.propTypes = {
  items: MobxPropTypes.arrayOrObservableArray.isRequired,
}

module.exports = {
  Breadcrumb,
  BreadcrumbPadding,
}
