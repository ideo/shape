import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CircleAddRowIcon from '~/ui/icons/CircleAddRowIcon'
import CircleTrashIcon from '~/ui/icons/CircleTrashIcon'
import HotCell from '~/ui/grid/HotCell'
import InlineLoader from '~/ui/layout/InlineLoader'
import PlusIcon from '~/ui/icons/PlusIcon'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const StyledPlusIcon = styled.div`
  position: absolute;
  /* TODO: better styling than this? */
  width: 20%;
  height: 20%;
  top: 38%;
  left: 38%;
  color: ${v.colors.secondaryMedium};
`

const RightBlankActions = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 12px;
  top: calc(50% - 36px);
`
RightBlankActions.displayName = 'RightBlankActions'

export const CircleIconHolder = styled.button`
  border: 1px solid ${v.colors.secondaryMedium};
  border-radius: 50%;
  color: ${v.colors.secondaryMedium};
  height: 32px;
  width: 32px;
`

const StyledGridCardEmpty = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  ${props =>
    !props.currentlyHotCell &&
    `
  &.visible,
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
    .plus-icon {
      display: block;
    }
    .cloud-icon {
      display: block;
    }
  }
  .plus-icon,
  .cloud-icon {
    display: none;
  }
  `}
`

@inject('uiStore')
@observer
class GridCardEmptyHotspot extends React.Component {
  get renderRightBlankActions() {
    const { handleRemoveRowClick, handleInsertRowClick, rowIdx } = this.props
    return (
      <RightBlankActions>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Remove row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleRemoveRowClick(ev, rowIdx)}>
            <CircleTrashIcon />
          </CircleIconHolder>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Add row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleInsertRowClick(ev, rowIdx)}>
            <CircleAddRowIcon />
          </CircleIconHolder>
        </Tooltip>
      </RightBlankActions>
    )
  }

  render() {
    const {
      parent,
      visible,
      interactionType,
      isFourWideBoard,
      emptyRow,
      rowIdx,
      uiStore,
    } = this.props

    let inner = ''

    if (interactionType === 'hover') {
      inner = (
        <div
          style={{ position: 'relative', height: '100%' }}
          data-empty-space-click
        >
          <StyledPlusIcon className="plus-icon">
            <PlusIcon />
          </StyledPlusIcon>
          {isFourWideBoard && emptyRow && this.renderRightBlankActions(rowIdx)}
        </div>
      )
    } else if (interactionType === 'unrendered') {
      inner = <InlineLoader background={v.colors.commonLightest} />
    }
    if (this.isMouseOver || uiStore.blankContentType) {
      inner = <HotCell parent={parent} />
    }

    return (
      <StyledGridCardEmpty
        className={visible ? 'visible' : ''}
        onMouseEnter={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        currentlyHotCell={this.isMouseOver}
      >
        {inner}
      </StyledGridCardEmpty>
    )
  }
}

GridCardEmptyHotspot.propTypes = {
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject,
  visible: PropTypes.bool,
  interactionType: PropTypes.string,
  emptyRow: PropTypes.bool,
  isFourWideBoard: PropTypes.bool,
  handleRemoveRowClick: PropTypes.func,
  handleInsertRowClick: PropTypes.func,
  rowIdx: PropTypes.number,
}
GridCardEmptyHotspot.defaultProps = {
  visible: true,
  card: null,
  interactionType: 'drag',
  emptyRow: false,
  isFourWideBoard: false,
  handleRemoveRowClick: null,
  handleInsertRowClick: null,
  rowIdx: 0,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
