import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { routingStore } from '~/stores'
import LinkIconSm from '~/ui/icons/LinkIconSm'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import WithDropTarget from '~/ui/global/WithDropTarget'

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
  ${props =>
    props.currentlyDraggedOn &&
    `
    background: ${v.colors.primaryLight};
  `};
  a {
    color: ${props => (props.isLast ? v.colors.black : v.colors.commonDark)};
    text-decoration: none;
    display: inline-block;
    transition: ${v.transition};
    &:hover {
      cursor: pointer;
      color: ${v.colors.primaryDarkest};
    }
  }
`
StyledBreadcrumbItem.displayName = 'StyledBreadcrumbItem'

const StyledRestoreButton = styled.button`
  height: 15px;
  width: 15px;
  margin-right: 5px;
  display: inline-block;
  position: relative;
  top: 1px;
  background-color: ${v.colors.primaryMediumDark};
  color: ${v.colors.white};
  border-radius: 50%;
`
StyledRestoreButton.displayName = 'StyledRestoreButton'

@observer
// also export unwrapped component for unit test
export class BreadcrumbItem extends React.Component {
  render() {
    const { item, index, numItems, restoreBreadcrumb } = this.props
    const isLast = index === numItems - 1
    let path
    if (item.id === 'homepage') {
      path = routingStore.pathTo('homepage')
    } else {
      path = routingStore.pathTo(item.type, item.id)
    }
    const { currentlyDraggedOn } = this.props
    const showDrag =
      currentlyDraggedOn &&
      currentlyDraggedOn.item.identifier === item.identifier
    return (
      <Fragment key={path}>
        <StyledBreadcrumbItem
          data-cy="Breadcrumb"
          innerRef={this.props.forwardedRef}
          currentlyDraggedOn={!!showDrag}
          isLast={isLast}
        >
          {item.link && (
            <Tooltip
              title={`switch to ${item.name}'s actual location`}
              placement="top"
            >
              <StyledRestoreButton onClick={restoreBreadcrumb}>
                <LinkIconSm />
              </StyledRestoreButton>
            </Tooltip>
          )}
          {item.ellipses || item.truncatedName ? (
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title={item.name}
              placement="top"
            >
              <Link to={path}>{item.truncatedName}…</Link>
            </Tooltip>
          ) : (
            <Link to={path}>{item.name}</Link>
          )}
        </StyledBreadcrumbItem>
        {!isLast && <StyledBreadcrumbCaret>&#62;</StyledBreadcrumbCaret>}
      </Fragment>
    )
  }
}

BreadcrumbItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  index: PropTypes.number.isRequired,
  numItems: PropTypes.number.isRequired,
  forwardedRef: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),
  currentlyDraggedOn: MobxPropTypes.objectOrObservableObject,
  restoreBreadcrumb: PropTypes.func.isRequired,
}

BreadcrumbItem.defaultProps = {
  forwardedRef: React.createRef(),
  currentlyDraggedOn: null,
}
BreadcrumbItem.displayName = 'BreadcrumbItem'

export default WithDropTarget(BreadcrumbItem)
