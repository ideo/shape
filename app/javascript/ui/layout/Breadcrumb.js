import PropTypes from 'prop-types'
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
  componentDidMount() {
    const { record, isHomepage } = this.props
    if (isHomepage) return
    // this will set record.inMyCollection = true/false
    apiStore.checkInMyCollection(record)
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
      <span className="crumb" key={path} data-cy="Breadcrumb">
        <Link to={path}>{name}</Link>
      </span>
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
      <StyledBreadcrumb>
        {this.renderMyCollection()}
        {links}
      </StyledBreadcrumb>
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
