import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const StyledBreadcrumb = styled.div`
  font-size: 15px;
  color: #9b9b9b;
  letter-spacing: 1.5px;
  font-family: 'Gotham';
  a {
    text-decoration: none;
  }
  a:last-child:after {
    content: '';
  }
  a:after {
    content: ' > ';
  }
`

const pathForItem = (item) => {
  const [klass, id] = item.split('_')
  return `/${klass}/${id}`
}

class Breadcrumb extends React.PureComponent {
  breadcrumbItem = (item) => {
    const path = pathForItem(item[0])
    return (
      <Link key={path} to={path}>
        {item[1]}
      </Link>
    )
  }

  render() {
    const { items } = this.props
    console.log(items)
    const links = items.map(item => this.breadcrumbItem(item))
    return (
      <StyledBreadcrumb>
        {links}
      </StyledBreadcrumb>
    )
  }
}

Breadcrumb.propTypes = {
  items: MobxPropTypes.arrayOrObservableArray.isRequired,
}

export default Breadcrumb
