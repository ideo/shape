import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import _ from 'lodash'

const StyledBreadcrumb = styled.div`
  font-size: 15px;
  color: #9b9b9b;
  letter-spacing: 1.5px;
  font-family: 'Gotham';
`

class Breadcrumb extends React.PureComponent {
  routeForItem(item) {
    const { klass, id } = item;
    return {klass}/{id};
  }

  breadcrumbItem = (item) => (
    <a href={this.routeForItem(item[0])}>{item[1]}</a>
  )

  render() {
    const { items } = this.props
    const links = items.map(item => this.breadcrumbItem(item))
    return (
      <StyledBreadcrumb>
        {links.join(' > ')}
      </StyledBreadcrumb>
    )
  }
}

Breadcrumb.propTypes = {
  items: PropTypes.array.isRequired,
  user: PropTypes.object,
}

export default Breadcrumb
