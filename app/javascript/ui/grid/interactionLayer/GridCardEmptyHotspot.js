import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'

import InlineLoader from '~/ui/layout/InlineLoader'
import Tooltip from '~/ui/global/Tooltip'
import PlusIcon from '~/ui/icons/PlusIcon'
import CircleTrashIcon from '~/ui/icons/CircleTrashIcon'
import CircleAddRowIcon from '~/ui/icons/CircleAddRowIcon'

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

  &.visible,
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
    .plus-icon {
      display: block;
    }
  }
  .plus-icon,
    display: none;
  }
`

@inject('uiStore')
@observer
class GridCardEmptyHotspot extends React.Component {
  renderRightBlankActions() {
    const { handleRemoveRowClick, handleInsertRowClick, row } = this.props
    return (
      <RightBlankActions>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Remove row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleRemoveRowClick(ev, row)}>
            <CircleTrashIcon />
          </CircleIconHolder>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Add row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleInsertRowClick(ev, row)}>
            <CircleAddRowIcon />
          </CircleIconHolder>
        </Tooltip>
      </RightBlankActions>
    )
  }

  render() {
    const { interactionType, emptyRow, isFourWideBoard, row } = this.props

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
          {isFourWideBoard && emptyRow && this.renderRightBlankActions(row)}
        </div>
      )
    } else if (interactionType === 'unrendered') {
      inner = <InlineLoader background={v.colors.commonLightest} />
    }

    return <StyledGridCardEmpty className={''}>{inner}</StyledGridCardEmpty>
  }
}

GridCardEmptyHotspot.propTypes = {
  card: MobxPropTypes.objectOrObservableObject,
  interactionType: PropTypes.string,
  numColumns: PropTypes.number,
  emptyRow: PropTypes.bool,
  isFourWideBoard: PropTypes.bool,
  handleRemoveRowClick: PropTypes.func,
  handleInsertRowClick: PropTypes.func,
  row: PropTypes.number,
}
GridCardEmptyHotspot.defaultProps = {
  card: null,
  interactionType: 'drag',
  numColumns: 4,
  emptyRow: false,
  isFourWideBoard: false,
  handleRemoveRowClick: null,
  handleInsertRowClick: null,
  row: 0,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
